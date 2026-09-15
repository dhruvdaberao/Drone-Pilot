// ==========================================================
// DRONE PILOT — METEOROLOGICAL ENVIRONMENT MODEL
// Simulates wind vectors, continuous turbulent gusting,
// temperature-dependent air density, rain, and visibility.
// ==========================================================

import { EnvironmentState, WeatherPreset } from "./types";

export class EnvironmentModel {
  private state: EnvironmentState = {
    weather: "clear",
    preset: "normal",
    windSpeed: 2.0,
    windDirection: 45, // blowing from Northeast
    windGust: 1.2,
    temperature: 20.0,
    rainIntensity: "off",
    visibility: "clear",
    timeOfDay: "noon",
  };

  private elapsed = 0;

  constructor(initialState?: Partial<EnvironmentState>) {
    if (initialState) {
      this.state = { ...this.state, ...initialState };
    }
  }

  public getState(): EnvironmentState {
    return { ...this.state };
  }

  public setState(updates: Partial<EnvironmentState>) {
    this.state = { ...this.state, ...updates };
  }

  public applyPreset(preset: WeatherPreset) {
    switch (preset) {
      case "windy":
        this.state = {
          ...this.state,
          preset: "windy",
          weather: "windy",
          windSpeed: 9.5,
          windDirection: 70,
          windGust: 4.8,
          temperature: 16,
          rainIntensity: "off",
          visibility: "clear",
        };
        break;
      case "hot":
        this.state = {
          ...this.state,
          preset: "hot",
          weather: "clear",
          windSpeed: 1.5,
          windDirection: 180,
          windGust: 0.8,
          temperature: 38,
          rainIntensity: "off",
          visibility: "hazy",
        };
        break;
      case "rain":
        this.state = {
          ...this.state,
          preset: "rain",
          weather: "rain",
          windSpeed: 6.0,
          windDirection: 210,
          windGust: 3.5,
          temperature: 14,
          rainIntensity: "moderate",
          visibility: "hazy",
        };
        break;
      case "fog":
        this.state = {
          ...this.state,
          preset: "fog",
          weather: "fog",
          windSpeed: 0.8,
          windDirection: 0,
          windGust: 0.4,
          temperature: 9,
          rainIntensity: "off",
          visibility: "foggy",
        };
        break;
      case "storm":
        this.state = {
          ...this.state,
          preset: "storm",
          weather: "storm",
          windSpeed: 14.5,
          windDirection: 285,
          windGust: 7.2,
          temperature: 12,
          rainIntensity: "heavy",
          visibility: "foggy",
        };
        break;
      case "normal":
      default:
        this.state = {
          ...this.state,
          preset: "normal",
          weather: "clear",
          windSpeed: 2.0,
          windDirection: 45,
          windGust: 1.0,
          temperature: 20,
          rainIntensity: "off",
          visibility: "clear",
        };
        break;
    }
  }

  /**
   * Computes instantaneous wind vector in world coordinates [Vx, Vy, Vz] (m/s)
   */
  public getInstantaneousWind(dt: number): { x: number; y: number; z: number } {
    this.elapsed += dt;

    // Wind direction angle in radians
    const dirRad = (this.state.windDirection * Math.PI) / 180.0;

    // Continuous turbulent gust harmonics
    const gustFactor = Math.sin(this.elapsed * 0.7) * 0.6 + Math.cos(this.elapsed * 1.6) * 0.4;
    const currentSpeed = Math.max(0, this.state.windSpeed + this.state.windGust * gustFactor);

    // Wind vector points in the direction the air is flowing towards
    const windVx = Math.sin(dirRad) * currentSpeed;
    const windVz = Math.cos(dirRad) * currentSpeed;
    const windVy = Math.sin(this.elapsed * 1.2) * (this.state.windGust * 0.15);

    return { x: windVx, y: windVy, z: windVz };
  }

  /**
   * Air density based on temperature: rho = P / (R * T)
   * Sea level standard: ~1.225 kg/m^3 at 15°C
   */
  public getAirDensity(): number {
    const tempKelvin = this.state.temperature + 273.15;
    return (101325 / (287.05 * tempKelvin));
  }
}
