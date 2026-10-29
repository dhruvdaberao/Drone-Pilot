// ==============================================================================
// DRONE PILOT — HIGH PERFORMANCE COMPUTING (HPC) C++ 6-DoF PHYSICS CORE
// Optimized for Native Compilation and WebAssembly (WASM) via Emscripten
// ==============================================================================

#ifndef DRONE_PHYSICS_HPP
#define DRONE_PHYSICS_HPP

#include <vector>
#include <cmath>
#include <array>
#include <string>

namespace DroneHPC {

struct Vector3 {
    double x = 0.0;
    double y = 0.0;
    double z = 0.0;

    Vector3 operator+(const Vector3& o) const { return {x + o.x, y + o.y, z + o.z}; }
    Vector3 operator-(const Vector3& o) const { return {x - o.x, y - o.y, z - o.z}; }
    Vector3 operator*(double s) const { return {x * s, y * s, z * s}; }
    double length() const { return std::sqrt(x * x + y * y + z * z); }
};

struct MotorSpec {
    int id;
    Vector3 position; // Relative to CG in meters
    int direction;    // +1 CW, -1 CCW
    double thrustFactor;
};

struct DronePhysicalParams {
    double dryMassKg = 1.45;
    double payloadMassKg = 0.0;
    double maxThrustNewtons = 32.0;
    int motorCount = 4;
    Vector3 inertia = {0.025, 0.025, 0.045}; // Ixx, Iyy, Izz
    double dragCoefficient = 0.35;
    std::vector<MotorSpec> motors;
};

struct PilotInput {
    double throttle = 0.0; // [-1.0, 1.0]
    double pitch = 0.0;    // [-1.0, 1.0]
    double roll = 0.0;     // [-1.0, 1.0]
    double yaw = 0.0;      // [-1.0, 1.0]
};

struct HPCTelemetry {
    Vector3 position;
    Vector3 velocity;
    Vector3 acceleration;
    Vector3 angularVelocity; // Pitch, Roll, Yaw rates
    Vector3 orientation;     // Euler Pitch, Roll, Yaw (rad)
    double altitudeAgl;
    double groundSpeedKmh;
    double batteryLevelPct;
    std::vector<double> motorOutputs;
    bool isArmed;
    bool isCrashed;
};

class DronePhysicsEngineCPP {
public:
    DronePhysicsEngineCPP();
    explicit DronePhysicsEngineCPP(const DronePhysicalParams& params);

    void reset(double spawnX = 0.0, double spawnY = 1.45, double spawnZ = 0.0);
    void setPayload(double massKg);
    void setWind(const Vector3& windVectorMs);

    // 6-DoF Numerical Integration Step (RK4 or Semi-Implicit Euler)
    HPCTelemetry step(const PilotInput& input, double dt);

    // Batch Monte Carlo Evaluation (HPC Parallel Workload)
    static std::vector<HPCTelemetry> runBatchTrajectory(
        const DronePhysicalParams& params,
        const std::vector<PilotInput>& inputs,
        double dt
    );

private:
    DronePhysicalParams m_params;
    Vector3 m_position;
    Vector3 m_velocity;
    Vector3 m_acceleration;
    Vector3 m_orientation;      // pitch, roll, yaw
    Vector3 m_angularVelocity; // rates
    Vector3 m_windVelocity;
    
    double m_batteryPct = 100.0;
    double m_groundLevel = 1.445;
    bool m_isArmed = false;
    bool m_isCrashed = false;

    std::vector<double> calculateMotorMixer(const PilotInput& input, double totalMass, double hoverWeight);
};

} // namespace DroneHPC

#endif // DRONE_PHYSICS_HPP
