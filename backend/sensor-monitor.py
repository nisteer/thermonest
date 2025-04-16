from influxdb_client import InfluxDBClient, Point, WriteOptions
from influxdb_client.client.write_api import SYNCHRONOUS
import signal
from serial_port import serial_port_reader
import config  # <-- Import your config file

shutdown = False  # Flag to check if the program should shut down

# Function to handle Ctrl+C signal and gracefully shut down
def signal_handler(signal, frame):
    global shutdown, write_api
    shutdown = True  # Set shutdown flag to True when Ctrl+C is pressed
    print('You pressed Ctrl+C!\nExiting...')
    write_api.close()  # Close the write API connection to InfluxDB

# Register the signal handler for SIGINT (Ctrl+C)
signal.signal(signal.SIGINT, signal_handler)
print('Press Ctrl+C to stop and exit!')

# Prompt user to enter the serial port number
serial_port = input("Enter Serial Port #: ")

# Set up the serial port reader using the config parameters
s_port = serial_port_reader.serial_port_reader(
    config.DEVICE["name"],        # Device name from config
    serial_port,                  # Serial port input from user
    config.DEVICE["baudrate"]     # Baudrate from config
)

# Open the connection to the serial port
s_port.open_connection()

# Set up the InfluxDB client with connection details from the config
client = InfluxDBClient(
    url=config.INFLUXDB["url"],        # URL of the InfluxDB instance
    token=config.INFLUXDB["token"],    # Token for authentication
    org=config.INFLUXDB["org"]         # Organization name
)

# Initialize the InfluxDB write API with synchronous write options
write_api = client.write_api(write_options=SYNCHRONOUS)

# Main loop to keep reading data from the serial port until shutdown
while not shutdown:
    # Read one line of data from the serial port
    line = s_port.read_line()
    
    # Split the line into temperature and humidity values
    fields = line.split(',')
    temperature = float(fields[0])  # Convert temperature to float
    humidity = float(fields[1])     # Convert humidity to float
    
    # Print temperature and humidity to the console for debugging
    print('Temperature: %s, Humidity: %s' % (temperature, humidity))

    # Create a Point for temperature and write it to InfluxDB
    p_temp = Point("temperature").tag("source", config.DEVICE["name"]).field("value", temperature)
    write_api.write(bucket=config.INFLUXDB["bucket"], org=config.INFLUXDB["org"], record=p_temp)

    # Create a Point for humidity and write it to InfluxDB
    p_humidity = Point("humidity").tag("source", config.DEVICE["name"]).field("value", humidity)
    write_api.write(bucket=config.INFLUXDB["bucket"], org=config.INFLUXDB["org"], record=p_humidity)

# Close the serial port connection after the loop ends
s_port.close_connection()
