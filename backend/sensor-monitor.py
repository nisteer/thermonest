from influxdb_client import InfluxDBClient, Point, WriteOptions
from influxdb_client.client.write_api import SYNCHRONOUS
import signal
from serial_port import serial_port_reader
import config  # <-- Import your config file

shutdown = False

def signal_handler(signal, frame):
    global shutdown, write_api
    shutdown = True
    print('You pressed Ctrl+C!\nExiting...')
    write_api.close()

signal.signal(signal.SIGINT, signal_handler)
print('Press Ctrl+C to stop and exit!')

serial_port = input("Enter Serial Port #: ")

s_port = serial_port_reader.serial_port_reader(
    config.DEVICE["name"],
    serial_port,
    config.DEVICE["baudrate"]
)
s_port.open_connection()

client = InfluxDBClient(
    url=config.INFLUXDB["url"],
    token=config.INFLUXDB["token"],
    org=config.INFLUXDB["org"]
)
write_api = client.write_api(write_options=SYNCHRONOUS)

while not shutdown:
    line = s_port.read_line()
    fields = line.split(',')
    temperature = float(fields[0])
    humidity = float(fields[1])
    print('Temperature: %s, Humidity: %s' % (temperature, humidity))

    p_temp = Point("temperature").tag("source", config.DEVICE["name"]).field("value", temperature)
    write_api.write(bucket=config.INFLUXDB["bucket"], org=config.INFLUXDB["org"], record=p_temp)

    p_humidity = Point("humidity").tag("source", config.DEVICE["name"]).field("value", humidity)
    write_api.write(bucket=config.INFLUXDB["bucket"], org=config.INFLUXDB["org"], record=p_humidity)

s_port.close_connection()
