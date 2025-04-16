#include <DHT.h>              // Include the DHT sensor library
#include <LiquidCrystal.h>     // Include the LCD display library

// DHTPIN is the pin where the DHT sensor is connected
#define DHTPIN 2              // Define pin 2 for the DHT sensor connection

// DHT11 sensor type
#define DHTTYPE DHT11         // Define the type of DHT sensor (DHT11 in this case)
DHT dht(DHTPIN, DHTTYPE);    // Create a DHT object using the specified pin and sensor type

// Pins used for LCD display
LiquidCrystal lcd(12, 11, 10, 9, 8, 7);  // Define LCD pins (RS, E, D4, D5, D6, D7)

// Setup function to initialize serial communication and LCD
void setup() {
  Serial.begin(9600);  // Start serial communication at a baud rate of 9600
  lcd.begin(16, 2);     // Initialize the LCD display with 16 columns and 2 rows
  lcd.print("Temperature");  // Display "Temperature" on the first row of the LCD
  lcd.setCursor(0, 1);       // Move the cursor to the beginning of the second row
  lcd.print("Humidity");     // Display "Humidity" on the second row of the LCD
  dht.begin();               // Initialize the DHT sensor
}

// Main loop to read data from the DHT sensor and display it
void loop() {
  int t = dht.readTemperature();  // Read the temperature from the DHT sensor
  int h = dht.readHumidity();     // Read the humidity from the DHT sensor
  
  // Display the temperature on the LCD, at the 14th column of the first row
  lcd.setCursor(14, 0);  
  lcd.print(t);                  
  
  // Display the humidity on the LCD, at the 14th column of the second row
  lcd.setCursor(14, 1);
  lcd.print(h);                   
  
  // Print the temperature and humidity to the serial monitor
  Serial.print(t);                 
  Serial.print(',');              
  Serial.println(h);              

  delay(5000);  // Wait for 5 seconds before taking the next reading
}
