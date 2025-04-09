#include <DHT.h>
#include <LiquidCrystal.h>

// DHTPIN is the pin where the DHT sensor is connected
#define DHTPIN 2

// DHT11
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
// Pins used for LCD display
LiquidCrystal lcd(12, 11, 10, 9, 8, 7);

void setup() {
  Serial.begin(9600);
  // Impostazione del tipo di display (colonne, righe)
  lcd.begin(16, 2);
  lcd.print("Temperature");
  lcd.setCursor(0,1);
  lcd.print("Humidity");
  dht.begin();
}

void loop() {
  int t = dht.readTemperature();
  int h = dht.readHumidity();
  lcd.setCursor(14, 0);
  lcd.print(t);
  lcd.setCursor(14, 1);
  lcd.print(h);
  Serial.print(t);
  Serial.print(',');
  Serial.println(h);
  delay(5000);
}
