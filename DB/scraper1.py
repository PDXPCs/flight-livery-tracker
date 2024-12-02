import requests
from bs4 import BeautifulSoup
import sqlite3
import re  # To help with cleaning descriptions

# Connect to SQLite database (or create it if it doesn't exist)
conn = sqlite3.connect('liveries.db')
cursor = conn.cursor()

# Create a table for liveries with the necessary columns if it doesn't exist
cursor.execute('''
CREATE TABLE IF NOT EXISTS liveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    airline TEXT,
    registration TEXT,
    aircraft_model TEXT,
    location TEXT,
    image_url TEXT
)
''')

# Set custom headers
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
}

# Function to scrape a single page
def scrape_page(page_num):
    url = f"https://www.airliners.net/photo-albums/view/Special-Liveries/41555?page={page_num}"
    
    try:
        print(f"Scraping page {page_num}...")
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        print(f"Page {page_num} retrieved successfully!")

        soup = BeautifulSoup(response.content, 'html.parser')
        liveries_section = soup.select_one('#layout-page > div.layout-body > section > section.layout-main-content.layout-has-sidebar > section > section > div > section.photo-search-v2')
        liveries = liveries_section.find_all('div', class_='card-image') if liveries_section else []
        
        print(f"Found {len(liveries)} liveries on page {page_num}.")

        # Loop through each livery and extract data
        for livery in liveries:
            img_tag = livery.find('img')
            if img_tag:
                image_url = img_tag['src']

                # Get details from sibling div for description and related info
                description_tag = livery.find_next_sibling('div', class_='card-body')
                if description_tag:
                    description = description_tag.get_text(strip=True)

                    # Extract airline, registration, aircraft model, and location using regex or string manipulation
                    registration = re.search(r'REG:([^\s]+)', description)
                    aircraft_model = re.search(r'Airbus|Boeing\s[^\s]+', description)
                    location = re.search(r'([A-Za-z\s]+)-\s?([A-Za-z\s]+)\(', description)

                    # Set default values if none are found
                    airline = description.split('REG:')[0].strip() if 'REG:' in description else "Unknown Airline"
                    registration = registration.group(1) if registration else "Unknown Registration"
                    aircraft_model = aircraft_model.group(0) if aircraft_model else "Unknown Model"
                    location = location.group(0) if location else "Unknown Location"

                else:
                    description = img_tag.get('alt', 'No Description')
                    airline = registration = aircraft_model = location = "Unknown"

                # Check if this record already exists in the database
                cursor.execute("SELECT * FROM liveries WHERE registration = ? OR image_url = ?", (registration, image_url))
                if cursor.fetchone() is None:  # Only insert if the record doesn't already exist
                    cursor.execute('''
                    INSERT INTO liveries (airline, registration, aircraft_model, location, image_url)
                    VALUES (?, ?, ?, ?, ?)
                    ''', (airline, registration, aircraft_model, location, image_url))
                    print(f"Inserted livery: {airline}, Registration: {registration}")
                else:
                    print(f"Livery with Registration {registration} or Image URL {image_url} already exists.")

        # Commit changes after each page
        conn.commit()

    except requests.exceptions.RequestException as e:
        print(f"Error occurred on page {page_num}: {e}")

# Scrape the first 10 pages
for page_num in range(1, 11):
    scrape_page(page_num)

# Close the connection
conn.close()
print("Database connection closed.")
