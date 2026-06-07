#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
UFC ELO Scraper Runner

This script provides a simple interface to run the UFC ELO scraper and display the results.
"""

import os
import sys
import pandas as pd
import json
from datetime import datetime

def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(f" {text} ".center(80, "="))
    print("=" * 80 + "\n")

def print_section(text):
    """Print a formatted section header"""
    print("\n" + "-" * 80)
    print(f" {text} ".center(80, "-"))
    print("-" * 80 + "\n")

def run_scraper():
    """Run the UFC ELO scraper"""
    print_header("UFC ELO SCRAPER")
    print("This script will run the UFC ELO scraper to calculate ELO ratings for UFC fighters.")
    print("The scraping process may take a long time due to the large number of fighters and fights.")
    print("Please be patient and respectful of ufcstats.com's servers.\n")
    
    # Check if data directory exists
    if not os.path.exists('data'):
        os.makedirs('data')
        print("Created 'data' directory.")
    
    # Explicitly initialize baseline runtime parameters
    update_mode = False
    testing_mode = False
    
    # Check if scraper has been run before
    has_fighter_data = os.path.exists('frontend/public/data/fighters.json')
    has_fight_data = os.path.exists('frontend/public/data/fights.json')
    has_elo_data = os.path.exists('frontend/public/data/fighter_elo_ratings.csv')
    
    if has_fighter_data and has_fight_data and has_elo_data:
        print("Existing data found. What would you like to do?")
        print("1. Use existing data and display results")
        print("2. UPDATE: Only scrape new events (Recommended)")
        print("3. Re-scrape all data (this will take a long time)")
        print("4. Run in testing mode (scrape first 10 fighters and 10 fights only)")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ")
        
        if choice == '1':
            display_results()
            return
        elif choice == '2':
            print("Checking for new events ... ")
            update_mode = True
            testing_mode = False
        elif choice == '3':
            cleanup_data_files()
            print("Deleted existing data files.")
            update_mode = False
            testing_mode = False
        elif choice == '4':
            cleanup_data_files()
            print("Deleted existing data files. Running in testing mode...")
            update_mode = False
            testing_mode = True
        elif choice == '5':
            print("Exiting...")
            sys.exit(0)
        else:
            print("Invalid choice. Exiting...")
            sys.exit(1)
    else:
        print("No existing data found. What would you like to do?")
        print("1. Run full scraper (this will take a long time)")
        print("2. Run in testing mode (scrape first 10 fighters and 10 fights only)")
        print("3. Exit")
        
        choice = input("\nEnter your choice (1-3): ")
        
        if choice == '1':
            testing_mode = False
            update_mode = False
        elif choice == '2':
            testing_mode = True
            update_mode = False
            print("Running in testing mode...")
        elif choice == '3':
            print("Exiting...")
            sys.exit(0)
        else:
            print("Invalid choice. Exiting...")
            sys.exit(1)
    
    print_section("RUNNING SCRAPER")
    if testing_mode:
        print("Starting the UFC ELO scraper in TESTING MODE (limited data)...")
    elif update_mode:
        print("Starting the UFC ELO scraper in INCREMENTAL UPDATE MODE...")
    else:
        print("Starting the UFC ELO scraper in FULL REBUILD MODE...")
    
    try:
        from ufc_elo_scraper import main
        main(testing_mode=testing_mode, update_mode=update_mode)
    except Exception as e:
        print(f"Error running scraper: {e}")
        sys.exit(1)
    
    display_results()

def cleanup_data_files():
    """Remove existing data files"""
    files_to_remove = [
        'frontend/public/data/fighters.json',
        'frontend/public/data/fights.json', 
        'frontend/public/data/fighter_elo_ratings.csv',
        'frontend/public/data/fighter_history.json'
    ]
    
    for file_path in files_to_remove:
        if os.path.exists(file_path):
            os.remove(file_path)

def display_results():
    """Display the results of the UFC ELO scraper"""
    print_header("UFC ELO RATINGS RESULTS")
    
    if not os.path.exists('frontend/public/data/fighter_elo_ratings.csv'):
        print("No results found. Please run the scraper first.")
        sys.exit(1)
    
    try:
        elo_df = pd.read_csv('frontend/public/data/fighter_elo_ratings.csv')
    except Exception as e:
        print(f"Error loading ELO ratings: {e}")
        sys.exit(1)
    
    print_section("STATISTICS")
    print(f"Total fighters: {len(elo_df)}")
    print(f"Average ELO rating: {elo_df['elo'].mean():.2f}")
    print(f"Highest ELO rating: {elo_df['elo'].max():.2f}")
    print(f"Lowest ELO rating: {elo_df['elo'].min():.2f}")
    
    print_section(f"TOP {min(20, len(elo_df))} FIGHTERS BY ELO RATING")
    top_fighters = elo_df.sort_values(by='elo', ascending=False).head(20)
    
    pd.set_option('display.max_rows', None)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 120)
    
    top_fighters = top_fighters.reset_index(drop=True)
    top_fighters.index = top_fighters.index + 1
    
    print(top_fighters[['name', 'elo', 'fight_count']].to_string(
        index_names=False,
        header=['Fighter', 'ELO Rating', 'Fights'],
        formatters={'elo': lambda x: f'{x:.2f}'}
    ))
    
    fighters_with_min_fights = elo_df[elo_df['fight_count'] >= 3]
    if len(fighters_with_min_fights) >= 10:
        print_section("BOTTOM 10 FIGHTERS BY ELO RATING (min. 3 fights)")
        bottom_fighters = fighters_with_min_fights.sort_values(by='elo', ascending=True).head(10)
        bottom_fighters = bottom_fighters.reset_index(drop=True)
        bottom_fighters.index = bottom_fighters.index + 1
        
        print(bottom_fighters[['name', 'elo', 'fight_count']].to_string(
            index_names=False,
            header=['Fighter', 'ELO Rating', 'Fights'],
            formatters={'elo': lambda x: f'{x:.2f}'}
        ))
    
    if os.path.exists('frontend/public/data/fighters.json') and os.path.exists('frontend/public/data/fighter_history.json'):
        print_section("TOP FIGHTERS BY WEIGHT CLASS")
        
        try:
            with open('frontend/public/data/fighters.json', 'r', encoding='utf-8') as f:
                fighters = json.load(f)
            
            weight_classes = {}
            for fighter in fighters:
                fighter_id = fighter.get('id')
                weight_class = fighter.get('weight class', fighter.get('weight', 'Unknown'))
                
                if fighter_id and weight_class != 'Unknown':
                    weight_classes[fighter_id] = weight_class
            
            elo_df['weight_class'] = elo_df['fighter_id'].map(weight_classes)
            weight_class_groups = elo_df.groupby('weight_class')
            
            standard_classes = [
                'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight',
                'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight'
            ]
            
            for weight_class in standard_classes:
                # Add flexible case checking for matching groups gracefully
                matched_key = next((k for k in weight_class_groups.groups.keys() if k and weight_class.lower() in k.lower()), None)
                if matched_key:
                    fighters_in_class = weight_class_groups.get_group(matched_key)
                    if len(fighters_in_class) > 0:
                        print(f"\n{weight_class}:")
                        top_in_class = fighters_in_class.sort_values(by='elo', ascending=False).head(3)
                        for i, (_, fighter) in enumerate(top_in_class.iterrows()):
                            print(f"{i+1}. {fighter['name']} - ELO: {fighter['elo']:.2f} ({fighter['fight_count']} fights)")
        except Exception as e:
            print(f"Error displaying weight class data: {e}")
    
    print_section("ANALYSIS COMPLETE")

if __name__ == "__main__":
    # If this is run by the headless automated runner system, drop straight into main with explicit params
    if os.path.exists('frontend/public/data/fights.json'):
        from ufc_elo_scraper import main
        # Force explicitly cleanly initialized flags
        main(testing_mode=False, update_mode=True)
    else:
        run_scraper()