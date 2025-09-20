from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import random
import time
from fake_useragent import UserAgent
import json
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

class AmazonScraper:
    def __init__(self, scraper_api_key):
        self.session = requests.Session()
        self.ua = UserAgent()
        self.scraper_api_key = scraper_api_key
        self.base_domain = "https://www.amazon.in"
        self.scraper_api_url = f"http://api.scraperapi.com/?api_key={scraper_api_key}&url="

    def get_random_headers(self):
        return {
            'User-Agent': self.ua.random,
            'Accept-Language': 'en-IN,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
        }

    def fetch_page(self, url, retries=5):
        for attempt in range(retries):
            try:
                time.sleep(random.uniform(2, 5))
                response = self.session.get(
                    self.scraper_api_url + url,
                    headers=self.get_random_headers(),
                    timeout=30
                )
                if response.status_code == 200:
                    return response
                print(f"Non-200 status code received: {response.status_code}")
                print(f"Response content preview: {response.text[:200]}")  # Debug info
                time.sleep(random.uniform(5, 10))
            except Exception as e:
                print(f"Error on attempt {attempt + 1}: {str(e)}")
                if attempt < retries - 1:
                    time.sleep(random.uniform(5, 10))
        return None

    def extract_product_data(self, card):
        try:
            # Updated selectors based on current Amazon HTML structure
            name_tag = card.select_one('h2.a-size-base-plus span') or \
                      card.select_one('h2[aria-label] span') or \
                      card.select_one('span.a-text-normal')
                      
            image_tag = card.select_one('img.s-image')
            
            # Updated price selector to handle different price formats
            price_tag = card.select_one('span.a-price span.a-offscreen') or \
                       card.select_one('span.a-price-whole')
                       
            link_tag = card.select_one('a.a-link-normal[href]')

            # Print debug information
            print(f"Name found: {name_tag.text.strip() if name_tag else 'None'}")
            print(f"Price found: {price_tag.text.strip() if price_tag else 'None'}")
            
            if not all([name_tag, image_tag, price_tag, link_tag]):
                print("Missing required elements for product")
                return None

            # Clean and format the price
            price_text = price_tag.text.strip()
            price = price_text.replace('₹', '').replace(',', '').strip()
            
            # Construct the product URL
            product_url = link_tag['href']
            if not product_url.startswith('http'):
                product_url = self.base_domain + product_url

            data = {
                'name': name_tag.text.strip(),
                'image_url': image_tag['src'].strip(),
                'price': price,
                'url': product_url
            }

            return data
            
        except Exception as e:
            print(f"Error extracting product data: {str(e)}")
            return None

    def scrape_products(self, search_query, max_products=50):
        all_products = []
        page = 1

        while len(all_products) < max_products:
            url = f"https://www.amazon.in/s?k={search_query}&page={page}"
            print(f"\nScraping page {page} for '{search_query}'...")
            print(f"URL: {url}")

            response = self.fetch_page(url)
            if not response:
                print("Failed to fetch page. Stopping scraping.")
                break

            soup = BeautifulSoup(response.text, 'html.parser')

            product_cards = soup.select("div.s-result-item[data-component-type='s-search-result']")

            if not product_cards:
                print("No product cards found. Stopping scraping.")
                print(f"Page content preview: {soup.text[:200]}")  # Debug info
                break

            print(f"Found {len(product_cards)} product cards on page {page}")

            for card in product_cards:
                if "AdHolder" in card.get('class', []):  # Skip sponsored products
                    continue

                product_data = self.extract_product_data(card)
                if product_data:
                    all_products.append(product_data)
                    print(f"Successfully extracted product: {product_data['name'][:50]}...")

                if len(all_products) >= max_products:
                    break

            print(f"Total products found: {len(all_products)}")
            if len(product_cards) < 10:  # Likely last page
                break

            page += 1
            time.sleep(random.uniform(1, 2))

        return all_products

@app.route('/scrape', methods=['POST'])
def scrape_data():
    try:
        search_query = request.json.get('search_query')
        if not search_query:
            return jsonify({'error': 'Search query is required'}), 400

        scraper_api_key = os.getenv("REACT_APP_SCRAPER_API_KEY")

        if not scraper_api_key:
            return jsonify({'error': 'ScraperAPI key not found in environment variables'}), 400

        scraper = AmazonScraper(scraper_api_key)
        products = scraper.scrape_products(search_query)

        if not products:
            return jsonify({'error': 'No products found or scraping failed'}), 404

        # Save with timestamp
        filename = f'amazon_products.json'
        with open(filename, 'w') as f:
            json.dump(products, f, indent=4)

        return jsonify({
            'message': 'Data scraped successfully!',
            'product_count': len(products),
            'filename': filename,
            'products': products
        })

    except Exception as e:
        return jsonify({'error': f'Scraping failed: {str(e)}'}), 500

@app.route('/products', methods=['GET'])
def get_products():
    try:
        with open('./amazon_products.json', 'r') as f:
            products = json.load(f)
        return jsonify(products)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

@app.route('/auto_scrape', methods=['GET'])
def auto_scrape():
    try:
        # Send POST request to /scrape
        post_url = 'http://127.0.0.1:5002/scrape'
        post_data = {'search_query': 'gaming chair'}
        post_response = requests.post(post_url, json=post_data)
        
        if post_response.status_code != 200:
            return jsonify({'error': f'Failed to scrape data: {post_response.text}'}), 500

        # Send GET request to /products
        get_url = 'http://127.0.0.1:5002/products'
        get_response = requests.get(get_url)
        
        if get_response.status_code != 200:
            return jsonify({'error': f'Failed to get products: {get_response.text}'}), 500

        return jsonify({'message': 'Data scraped and retrieved successfully!', 'products': get_response.json()})

    except Exception as e:
        return jsonify({'error': f'Auto scrape failed: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)