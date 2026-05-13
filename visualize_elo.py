#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
UFC ELO Visualizer

This script generates visualizations from the UFC ELO data.
"""

import os
import sys
import json
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np
from datetime import datetime

def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(f" {text} ".center(80, "="))
    print("=" * 80 + "\n")

def check_data_exists():
    """Check if the required data files exist"""
    required_files = [
        'data/fighter_elo_ratings.csv',
        'data/fighter_history.json',
        'data/fighters.json',
        'data/fights.json'
    ]
    
    for file in required_files:
        if not os.path.exists(file):
            print(f"Error: {file} not found. Please run the scraper first.")
            return False
    
    return True

def load_data():
    """Load the UFC ELO data"""
    # Load ELO ratings
    elo_df = pd.read_csv('data/fighter_elo_ratings.csv')
    
    # Load fighter history
    with open('data/fighter_history.json', 'r', encoding='utf-8') as f:
        fighter_history = json.load(f)
    
    # Load fighter data
    with open('data/fighters.json', 'r', encoding='utf-8') as f:
        fighters = json.load(f)
    
    # Load fight data
    with open('data/fights.json', 'r', encoding='utf-8') as f:
        fights = json.load(f)
    
    return elo_df, fighter_history, fighters, fights

def create_output_dir():
    """Create the output directory for visualizations"""
    os.makedirs('visualizations', exist_ok=True)

def plot_elo_distribution(elo_df):
    """Plot the distribution of ELO ratings"""
    plt.figure(figsize=(12, 8))
    
    # Create histogram
    plt.hist(elo_df['elo'], bins=30, alpha=0.7, color='blue', edgecolor='black')
    
    # Add vertical line for average ELO
    avg_elo = elo_df['elo'].mean()
    plt.axvline(avg_elo, color='red', linestyle='dashed', linewidth=2, label=f'Average ELO: {avg_elo:.2f}')
    
    # Add vertical line for initial ELO
    plt.axvline(1500, color='green', linestyle='dashed', linewidth=2, label='Initial ELO: 1500')
    
    # Add labels and title
    plt.xlabel('ELO Rating')
    plt.ylabel('Number of Fighters')
    plt.title('Distribution of UFC Fighter ELO Ratings')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Save the figure
    plt.tight_layout()
    plt.savefig('visualizations/elo_distribution.png', dpi=300)
    plt.close()
    
    print("Created ELO distribution visualization: visualizations/elo_distribution.png")

def plot_top_fighters(elo_df):
    """Plot the top 20 fighters by ELO rating"""
    # Get top 20 fighters
    top_fighters = elo_df.sort_values(by='elo', ascending=False).head(20)
    
    plt.figure(figsize=(14, 10))
    
    # Create horizontal bar chart
    bars = plt.barh(top_fighters['name'], top_fighters['elo'], color='blue', alpha=0.7)
    
    # Add ELO values as text
    for i, bar in enumerate(bars):
        plt.text(bar.get_width() + 5, bar.get_y() + bar.get_height()/2, 
                 f"{top_fighters['elo'].iloc[i]:.2f}", 
                 va='center', fontsize=10)
    
    # Add labels and title
    plt.xlabel('ELO Rating')
    plt.ylabel('Fighter')
    plt.title('Top 20 UFC Fighters by ELO Rating')
    plt.axvline(1500, color='green', linestyle='dashed', linewidth=2, label='Initial ELO: 1500')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Invert y-axis to show highest ELO at the top
    plt.gca().invert_yaxis()
    
    # Save the figure
    plt.tight_layout()
    plt.savefig('visualizations/top_fighters.png', dpi=300)
    plt.close()
    
    print("Created top fighters visualization: visualizations/top_fighters.png")

def plot_elo_by_weight_class(elo_df, fighters):
    """Plot the average ELO rating by weight class"""
    # Create a dictionary of fighter weight classes
    weight_classes = {}
    for fighter in fighters:
        fighter_id = fighter.get('id')
        weight_class = fighter.get('weight class', 'Unknown')
        
        if fighter_id and weight_class != 'Unknown':
            weight_classes[fighter_id] = weight_class
    
    # Add weight class to ELO dataframe
    elo_df['weight_class'] = elo_df['fighter_id'].map(weight_classes)
    
    # List of standard UFC weight classes
    standard_classes = [
        'Flyweight', 'Bantamweight', 'Featherweight', 'Lightweight',
        'Welterweight', 'Middleweight', 'Light Heavyweight', 'Heavyweight',
        "Women's Strawweight", "Women's Flyweight", "Women's Bantamweight", "Women's Featherweight"
    ]
    
    # Filter to only include standard weight classes
    weight_class_df = elo_df[elo_df['weight_class'].isin(standard_classes)]
    
    # Calculate average ELO by weight class
    avg_elo_by_class = weight_class_df.groupby('weight_class')['elo'].mean().reset_index()
    
    # Sort by average ELO
    avg_elo_by_class = avg_elo_by_class.sort_values(by='elo', ascending=False)
    
    plt.figure(figsize=(14, 10))
    
    # Create horizontal bar chart
    bars = plt.barh(avg_elo_by_class['weight_class'], avg_elo_by_class['elo'], color='purple', alpha=0.7)
    
    # Add ELO values as text
    for i, bar in enumerate(bars):
        plt.text(bar.get_width() + 1, bar.get_y() + bar.get_height()/2, 
                 f"{avg_elo_by_class['elo'].iloc[i]:.2f}", 
                 va='center', fontsize=10)
    
    # Add labels and title
    plt.xlabel('Average ELO Rating')
    plt.ylabel('Weight Class')
    plt.title('Average UFC Fighter ELO Rating by Weight Class')
    plt.axvline(1500, color='green', linestyle='dashed', linewidth=2, label='Initial ELO: 1500')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Save the figure
    plt.tight_layout()
    plt.savefig('visualizations/elo_by_weight_class.png', dpi=300)
    plt.close()
    
    print("Created weight class visualization: visualizations/elo_by_weight_class.png")

def plot_elo_history(fighter_history, fighters, elo_df):
    """Plot the ELO history for top fighters"""
    # Get top 5 fighters
    top_fighters = elo_df.sort_values(by='elo', ascending=False).head(5)
    
    plt.figure(figsize=(14, 10))
    
    # Plot ELO history for each top fighter
    for _, fighter in top_fighters.iterrows():
        fighter_id = fighter['fighter_id']
        fighter_name = fighter['name']
        
        # Get fighter history
        history = fighter_history.get(fighter_id, [])
        
        if history:
            # Sort history by date
            history = sorted(history, key=lambda x: x.get('date', '9999-99-99'))
            
            # Extract dates and ELO ratings
            dates = [h.get('date', '') for h in history]
            elos = [1500]  # Start with initial ELO
            elos.extend([h.get('new_elo', 1500) for h in history])
            
            # Add initial date (use first fight date minus 1 day)
            if dates:
                try:
                    first_date = datetime.strptime(dates[0], '%Y-%m-%d')
                    initial_date = (first_date.replace(day=first_date.day-1)).strftime('%Y-%m-%d')
                    dates.insert(0, initial_date)
                except:
                    dates.insert(0, '2000-01-01')  # Fallback initial date
            
            # Plot the ELO history
            plt.plot(range(len(elos)), elos, marker='o', linestyle='-', label=fighter_name)
    
    # Add labels and title
    plt.xlabel('Fight Number')
    plt.ylabel('ELO Rating')
    plt.title('ELO Rating History for Top 5 UFC Fighters')
    plt.axhline(1500, color='green', linestyle='dashed', linewidth=2, label='Initial ELO: 1500')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Set x-axis to show integers only
    plt.gca().xaxis.set_major_locator(ticker.MaxNLocator(integer=True))
    
    # Save the figure
    plt.tight_layout()
    plt.savefig('visualizations/elo_history.png', dpi=300)
    plt.close()
    
    print("Created ELO history visualization: visualizations/elo_history.png")

def plot_fight_count_vs_elo(elo_df):
    """Plot the relationship between fight count and ELO rating"""
    plt.figure(figsize=(12, 8))
    
    # Create scatter plot
    plt.scatter(elo_df['fight_count'], elo_df['elo'], alpha=0.5, color='blue')
    
    # Add trend line
    z = np.polyfit(elo_df['fight_count'], elo_df['elo'], 1)
    p = np.poly1d(z)
    plt.plot(elo_df['fight_count'], p(elo_df['fight_count']), "r--", alpha=0.8, 
             label=f"Trend: y={z[0]:.2f}x+{z[1]:.2f}")
    
    # Add labels and title
    plt.xlabel('Number of Fights')
    plt.ylabel('ELO Rating')
    plt.title('Relationship Between Fight Count and ELO Rating')
    plt.axhline(1500, color='green', linestyle='dashed', linewidth=2, label='Initial ELO: 1500')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Save the figure
    plt.tight_layout()
    plt.savefig('visualizations/fight_count_vs_elo.png', dpi=300)
    plt.close()
    
    print("Created fight count vs ELO visualization: visualizations/fight_count_vs_elo.png")

def main():
    """Main function to generate visualizations"""
    print_header("UFC ELO VISUALIZER")
    
    # Check if data exists
    if not check_data_exists():
        return
    
    # Create output directory
    create_output_dir()
    
    # Load data
    try:
        elo_df, fighter_history, fighters, fights = load_data()
    except Exception as e:
        print(f"Error loading data: {e}")
        return
    
    # Generate visualizations
    print("Generating visualizations...")
    
    try:
        plot_elo_distribution(elo_df)
        plot_top_fighters(elo_df)
        plot_elo_by_weight_class(elo_df, fighters)
        plot_elo_history(fighter_history, fighters, elo_df)
        plot_fight_count_vs_elo(elo_df)
    except Exception as e:
        print(f"Error generating visualizations: {e}")
        return
    
    print_header("VISUALIZATION COMPLETE")
    print("All visualizations have been saved to the 'visualizations' directory.")

if __name__ == "__main__":
    main()
