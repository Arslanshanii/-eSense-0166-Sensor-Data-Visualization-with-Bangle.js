# -eSense-0166-Sensor-Data-Visualization-with-Bangle.js

This project connects a Bangle.js device to an eSense-0166 sensor and visualizes the sensor data on the Bangle.js screen. The eSense-0166 sensor provides gyroscopic and accelerometer data.

## Prerequisites

Before running this code, ensure you have the following:

1. A Bangle.js device.
2. An eSense-0166 sensor device.

## Installation

1. Pair the Bangle.js device with the eSense-0166 sensor.
2. Upload the provided JavaScript code to your Bangle.js device.
3. Ensure that both devices are powered on and within Bluetooth range.

## Usage

1. The Bangle.js device will establish a connection with the eSense-0166 sensor upon startup.
2. The code will perform sensor calibration when first connected. This is essential for accurate sensor readings.
3. Once calibration is complete, the Bangle.js device will continuously receive sensor data.
4. The sensor data includes gyroscope and accelerometer readings.
5. The Bangle.js screen will display real-time time and date information.
6. If the Bangle.js is tilted significantly in the pitch axis (up or down), it will detect this and display a "PLEASE CORRECT YOUR HEAD POSITION" warning.
7. The warning will be displayed for a short duration, after which it will clear automatically.
8. The code will keep running and updating the screen with sensor data.

## Customization

You can customize the code as needed:

- Adjust the sensor data processing and calibration settings to fit your specific requirements.
- Modify the warning thresholds for head position correction (`pitch <= -40` and `pitch >= 40`) as per your use case.
- Change the timeout for displaying the warning message by modifying the `sleep` duration.

## Dependencies

This code relies on the Bangle.js JavaScript library for device interaction. It also uses Bluetooth for communication with the eSense-0166 sensor.

## License

This project is provided under the MIT License. Feel free to use, modify, and distribute it according to your needs.

## Acknowledgments

Special thanks to the Bangle.js and eSense-0166 communities for their support and resources.
