# UFC ELO Scraper

This program scrapes fighter and fight data from ufcstats.com and calculates ELO ratings for each fighter based on their fight history.

## Features

- Scrapes fighter data from ufcstats.com
- Scrapes fight data from ufcstats.com
- Calculates ELO ratings for each fighter based on their fight history
- Saves data to CSV and JSON files for further analysis
- Displays top fighters by ELO rating

## Requirements

- Python 3.6+
- Required packages:
  - requests
  - beautifulsoup4
  - pandas

## Installation

1. Clone this repository or download the files
2. Create a virtual environment (recommended):
   ```
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Install the required packages:
   ```
   pip install requests beautifulsoup4 pandas
   ```

## Usage

### Option 1: Using the convenience scripts

#### Windows
Run the `run.bat` file by double-clicking it or executing it from the command prompt:
```
run.bat
```

#### macOS/Linux
First, make the script executable:
```
chmod +x run.sh
```

Then run it:
```
./run.sh
```

### Option 2: Manual execution

Run the main script directly:

```
python ufc_elo_scraper.py
```

The script will:
1. Scrape fighter data from ufcstats.com
2. Scrape fight data from ufcstats.com
3. Calculate ELO ratings for each fighter
4. Save the results to CSV and JSON files in the `data` directory
5. Display the top 10 fighters by ELO rating

## Output Files

The script generates the following files in the `data` directory:

- `fighters.json`: Raw fighter data scraped from ufcstats.com
- `fights.json`: Raw fight data scraped from ufcstats.com
- `fighter_elo_ratings.csv`: ELO ratings for each fighter
- `fighter_history.json`: Fight history for each fighter with ELO changes

## Visualizations

The project includes a visualization script that generates various charts and graphs from the ELO data:

```
python visualize_elo.py
```

This script generates the following visualizations in the `visualizations` directory:

- `elo_distribution.png`: Distribution of ELO ratings across all fighters
- `top_fighters.png`: Top 20 fighters by ELO rating
- `elo_by_weight_class.png`: Average ELO rating by weight class
- `elo_history.png`: ELO rating history for the top 5 fighters
- `fight_count_vs_elo.png`: Relationship between fight count and ELO rating

## How ELO Rating Works

The ELO rating system is a method for calculating the relative skill levels of players in zero-sum games. In this implementation:

- All fighters start with an initial ELO rating of 1500
- After each fight, the winner gains points and the loser loses points
- The amount of points gained/lost depends on the difference in ELO ratings between the fighters
- Beating a higher-rated opponent results in more points gained
- The K-factor (set to 32) determines how much the ELO ratings change after each fight

## Notes

- The scraping process may take a long time due to the large number of fighters and fights in the UFC database
- The script includes delays between requests to avoid overloading the ufcstats.com server
- If the scraping process is interrupted, you can restart it and it will load the previously scraped data from the JSON files

## Disclaimer

This program is for educational purposes only. Please be respectful of ufcstats.com's servers and terms of service when using this program.
