// ==============================================================================
// DRONE PILOT — HIGH PERFORMANCE COMPUTING (HPC) C++ 6-DoF PHYSICS CORE
// Implementation file with 6-DoF Rigid Body dynamics & Emscripten WASM export
// ==============================================================================

#include "drone_physics.hpp"
#include <algorithm>
#include <iostream>

#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>
#endif

namespace DroneHPC {

DronePhysicsEngineCPP::DronePhysicsEngineCPP() {
    // Default Quadcopter X-configuration
    m_params.dryMassKg = 1.45;
    m_params.maxThrustNewtons = 32.0;
    m_params.motorCount = 4;
    m_params.inertia = {0.025, 0.025, 0.045};
    m_params.dragCoefficient = 0.35;

    const double arm = 0.225; // meters
    m_params.motors = {
        {0, { arm, 0.0, -arm},  1, 1.0}, // Front-Right (CW)
        {1, {-arm, 0.0,  arm},  1, 1.0}, // Rear-Left (CW)
        {2, { arm, 0.0,  arm}, -1, 1.0}, // Rear-Right (CCW)
        {3, {-arm, 0.0, -arm}, -1, 1.0}  // Front-Left (CCW)
    };

    reset();
}

DronePhysicsEngineCPP::DronePhysicsEngineCPP(const DronePhysicalParams& params)
    : m_params(params) {
    reset();
}

void DronePhysicsEngineCPP::reset(double spawnX, double spawnY, double spawnZ) {
    m_position = {spawnX, spawnY, spawnZ};
    m_velocity = {0.0, 0.0, 0.0};
    m_acceleration = {0.0, 0.0, 0.0};
    m_orientation = {0.0, 0.0, 0.0};
    m_angularVelocity = {0.0, 0.0, 0.0};
    m_windVelocity = {0.0, 0.0, 0.0};
    m_groundLevel = spawnY;
    m_batteryPct = 100.0;
    m_isArmed = false;
    m_isCrashed = false;
}

void DronePhysicsEngineCPP::setPayload(double massKg) {
    m_params.payloadMassKg = std::max(0.0, massKg);
}

void DronePhysicsEngineCPP::setWind(const Vector3& windVectorMs) {
    m_windVelocity = windVectorMs;
}

std::vector<double> DronePhysicsEngineCPP::calculateMotorMixer(
    const PilotInput& input,
    double totalMass,
    double hoverWeight
) {
    std::vector<double> outputs(m_params.motorCount, 0.0);
    const double baseHover = (hoverWeight / m_params.maxThrustNewtons);

    double throttleCmd = baseHover + input.throttle * 0.45;
    throttleCmd = std::clamp(throttleCmd, 0.05, 1.0);

    for (int i = 0; i < m_params.motorCount; ++i) {
        const auto& m = m_params.motors[i];
        // X-Configuration differential mixer
        double pitchMix = -m.position.z * input.pitch * 0.40;
        double rollMix  =  m.position.x * input.roll  * 0.40;
        double yawMix   =  m.direction  * input.yaw   * 0.20;

        outputs[i] = std::clamp(throttleCmd + pitchMix + rollMix + yawMix, 0.0, 1.0);
    }
    return outputs;
}

HPCTelemetry DronePhysicsEngineCPP::step(const PilotInput& input, double dt) {
    const double clampedDt = std::min(dt, 0.05);
    const double g = 9.80665;
    const double totalMass = m_params.dryMassKg + m_params.payloadMassKg;
    const double hoverWeight = totalMass * g;

    if (!m_isArmed && (input.throttle > 0.05 || std::abs(input.pitch) > 0.1 || std::abs(input.roll) > 0.1)) {
        m_isArmed = true;
    }

    if (m_isCrashed || !m_isArmed) {
        // Passive settling
        m_velocity.y -= g * clampedDt;
        m_position.y += m_velocity.y * clampedDt;
        if (m_position.y <= m_groundLevel) {
            m_position.y = m_groundLevel;
            m_velocity = {0.0, 0.0, 0.0};
        }
        return {
            m_position, m_velocity, m_acceleration, m_angularVelocity,
            m_orientation, std::max(0.0, m_position.y - m_groundLevel),
            0.0, m_batteryPct, std::vector<double>(m_params.motorCount, 0.0),
            m_isArmed, m_isCrashed
        };
    }

    // 1. Motor Mixing & Collective Thrust
    std::vector<double> motorOutputs = calculateMotorMixer(input, totalMass, hoverWeight);

    double totalThrottle = 0.0;
    for (double val : motorOutputs) totalThrottle += val;
    double avgThrottle = totalThrottle / m_params.motorCount;

    // Aerodynamic Ground Effect cushion (IGE) within 1.2m
    double agl = std::max(0.0, m_position.y - m_groundLevel);
    double igeFactor = 1.0;
    if (agl < 1.2) {
        double d = 1.0 - (agl / 1.2);
        igeFactor = 1.0 + (0.25 * d * d);
    }
    double collectiveThrust = avgThrottle * m_params.maxThrustNewtons * igeFactor;

    // 2. Translational Forces in World Frame
    // Body tilt projection
    double pitch = m_orientation.x;
    double roll  = m_orientation.y;
    double yaw   = m_orientation.z;

    double thrustX = collectiveThrust * (std::sin(roll) * std::cos(yaw) + std::cos(roll) * std::sin(pitch) * std::sin(yaw));
    double thrustY = collectiveThrust * (std::cos(pitch) * std::cos(roll));
    double thrustZ = collectiveThrust * (std::sin(roll) * std::sin(yaw) - std::cos(roll) * std::sin(pitch) * std::cos(yaw));

    // Relative Airspeed & Aerodynamic Drag
    Vector3 relVel = {
        m_velocity.x - m_windVelocity.x,
        m_velocity.y - m_windVelocity.y,
        m_velocity.z - m_windVelocity.z
    };
    double airSpeed = relVel.length();
    Vector3 dragForce = relVel * (-0.5 * 1.225 * m_params.dragCoefficient * airSpeed);

    // Total Acceleration
    m_acceleration.x = (thrustX + dragForce.x) / totalMass;
    m_acceleration.y = (thrustY + dragForce.y - hoverWeight) / totalMass;
    m_acceleration.z = (thrustZ + dragForce.z) / totalMass;

    // 3. Numerical Integration (Semi-Implicit Euler / Symplectic)
    m_velocity = m_velocity + m_acceleration * clampedDt;
    m_position = m_position + m_velocity * clampedDt;

    // Attitude Dynamics (First-Order Rate Damped Tracking)
    double targetPitch = input.pitch * 0.45;
    double targetRoll  = input.roll  * 0.45;
    m_orientation.x += (targetPitch - m_orientation.x) * (clampedDt * 8.0);
    m_orientation.y += (targetRoll  - m_orientation.y) * (clampedDt * 8.0);
    m_orientation.z += input.yaw * 2.5 * clampedDt;

    // 4. Ground Contact & Impact Evaluation
    if (m_position.y <= m_groundLevel) {
        m_position.y = m_groundLevel;
        if (m_velocity.y < -5.5) {
            m_isCrashed = true;
        }
        m_velocity.y = 0.0;
        m_velocity.x *= 0.85;
        m_velocity.z *= 0.85;
    }

    // Battery Discharge Dynamics
    m_batteryPct = std::max(0.0, m_batteryPct - (avgThrottle * 0.08 * clampedDt));

    double groundSpeed = std::sqrt(m_velocity.x * m_velocity.x + m_velocity.z * m_velocity.z) * 3.6;

    return {
        m_position,
        m_velocity,
        m_acceleration,
        m_angularVelocity,
        m_orientation,
        std::max(0.0, m_position.y - m_groundLevel),
        groundSpeed,
        m_batteryPct,
        motorOutputs,
        m_isArmed,
        m_isCrashed
    };
}

std::vector<HPCTelemetry> DronePhysicsEngineCPP::runBatchTrajectory(
    const DronePhysicalParams& params,
    const std::vector<PilotInput>& inputs,
    double dt
) {
    DronePhysicsEngineCPP engine(params);
    std::vector<HPCTelemetry> trajectory;
    trajectory.reserve(inputs.size());

    for (const auto& in : inputs) {
        trajectory.push_back(engine.step(in, dt));
    }
    return trajectory;
}

} // namespace DroneHPC

// ==============================================================================
// EMSCRIPTEN WEBASSEMBLY (WASM) BINDINGS
// Allows the browser to execute this exact C++ code at native machine speed
// ==============================================================================
#ifdef __EMSCRIPTEN__
using namespace emscripten;
using namespace DroneHPC;

EMSCRIPTEN_BINDINGS(drone_physics_wasm) {
    value_object<Vector3>("Vector3")
        .field("x", &Vector3::x)
        .field("y", &Vector3::y)
        .field("z", &Vector3::z);

    value_object<PilotInput>("PilotInput")
        .field("throttle", &PilotInput::throttle)
        .field("pitch", &PilotInput::pitch)
        .field("roll", &PilotInput::roll)
        .field("yaw", &PilotInput::yaw);

    register_vector<double>("VectorDouble");

    value_object<HPCTelemetry>("HPCTelemetry")
        .field("position", &HPCTelemetry::position)
        .field("velocity", &HPCTelemetry::velocity)
        .field("acceleration", &HPCTelemetry::acceleration)
        .field("altitudeAgl", &HPCTelemetry::altitudeAgl)
        .field("groundSpeedKmh", &HPCTelemetry::groundSpeedKmh)
        .field("batteryLevelPct", &HPCTelemetry::batteryLevelPct)
        .field("motorOutputs", &HPCTelemetry::motorOutputs)
        .field("isArmed", &HPCTelemetry::isArmed)
        .field("isCrashed", &HPCTelemetry::isCrashed);

    class_<DronePhysicsEngineCPP>("DronePhysicsEngineCPP")
        .constructor<>()
        .function("reset", &DronePhysicsEngineCPP::reset)
        .function("setPayload", &DronePhysicsEngineCPP::setPayload)
        .function("setWind", &DronePhysicsEngineCPP::setWind)
        .function("step", &DronePhysicsEngineCPP::step);
}
#endif
