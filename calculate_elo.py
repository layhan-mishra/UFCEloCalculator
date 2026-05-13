#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
UFC ELO Calculator

This module calculates ELO ratings from scraped fighter and fight data.
Can be run standalone or imported by the scraper.
"""

import json
import pandas as pd
import os

# Constants
INITIAL_ELO = 1000
K_FACTOR = 32  # Standard K-factor for ELO calculations

def calculate_elo(winner_elo, loser_elo):
    """
    Calculate new ELO ratings after a fight
    """
    # Calculate expected scores
    expected_winner = 1 / (1 + 10**((loser_elo - winner_elo) / 400))
    expected_loser = 1 / (1 + 10**((winner_elo - loser_elo) / 400))
    
    # Update ELO ratings (winner gets 1 point, loser gets 0)
    new_winner_elo = winner_elo + K_FACTOR * (1 - expected_winner)
    new_loser_elo = loser_elo + K_FACTOR * (0 - expected_loser)
    
    return new_winner_elo, new_loser_elo

def calculate_draw_elo(fighter1_elo, fighter2_elo):
    """
    Calculate new ELO ratings after a draw (both fighters get 0.5 points)
    """
    # Calculate expected scores
    expected_fighter1 = 1 / (1 + 10**((fighter2_elo - fighter1_elo) / 400))
    expected_fighter2 = 1 / (1 + 10**((fighter1_elo - fighter2_elo) / 400))
    
    # Update ELO ratings (both fighters get 0.5 points for a draw)
    new_fighter1_elo = fighter1_elo + K_FACTOR * (0.5 - expected_fighter1)
    new_fighter2_elo = fighter2_elo + K_FACTOR * (0.5 - expected_fighter2)
    
    return new_fighter1_elo, new_fighter2_elo


def process_fights_and_calculate_elo(fights):
    """
    Process fights in chronological order and calculate ELO ratings
    """
    # Sort fights by date
    sorted_fights = sorted(fights, key=lambda x: x.get('date', '9999-99-99'))
    
    # Initialize ELO ratings for all fighters
    fighter_elos = {}
    fighter_history = {}
    
    # Process each fight
    for fight in sorted_fights:
        fighter1_id = fight.get('fighter1_id')
        fighter2_id = fight.get('fighter2_id')
        result_type = fight.get('result_type', 'win')
        winner_id = fight.get('winner_id')
        
        # Skip fights with missing data
        if not all([fighter1_id, fighter2_id]):
            continue
        
        # Initialize ELO ratings if not already done
        if fighter1_id not in fighter_elos:
            fighter_elos[fighter1_id] = INITIAL_ELO
            fighter_history[fighter1_id] = []
        
        if fighter2_id not in fighter_elos:
            fighter_elos[fighter2_id] = INITIAL_ELO
            fighter_history[fighter2_id] = []
        
        # Get current ELO ratings
        fighter1_elo = fighter_elos[fighter1_id]
        fighter2_elo = fighter_elos[fighter2_id]
        
        # Handle different result types
        if result_type == 'draw':
            # Calculate draw ELO changes
            new_fighter1_elo, new_fighter2_elo = calculate_draw_elo(fighter1_elo, fighter2_elo)
            
            # Update ELO ratings
            fighter_elos[fighter1_id] = new_fighter1_elo
            fighter_elos[fighter2_id] = new_fighter2_elo
            
            # Record fight in fighter history
            fighter_history[fighter1_id].append({
                'date': fight.get('date'),
                'opponent_id': fighter2_id,
                'opponent_name': fight.get('fighter2_name'),
                'result': 'draw',
                'old_elo': fighter1_elo,
                'new_elo': new_fighter1_elo,
                'event': fight.get('event_name'),
                'method': fight.get('method'),
                'fight_id': fight.get('id')
            })
            
            fighter_history[fighter2_id].append({
                'date': fight.get('date'),
                'opponent_id': fighter1_id,
                'opponent_name': fight.get('fighter1_name'),
                'result': 'draw',
                'old_elo': fighter2_elo,
                'new_elo': new_fighter2_elo,
                'event': fight.get('event_name'),
                'method': fight.get('method'),
                'fight_id': fight.get('id')
            })
            
        elif result_type == 'no_contest':
            # No ELO change for no contests
            fighter_history[fighter1_id].append({
                'date': fight.get('date'),
                'opponent_id': fighter2_id,
                'opponent_name': fight.get('fighter2_name'),
                'result': 'no_contest',
                'old_elo': fighter1_elo,
                'new_elo': fighter1_elo,  # No change
                'event': fight.get('event_name'),
                'method': fight.get('method'),
                'fight_id': fight.get('id')
            })
            
            fighter_history[fighter2_id].append({
                'date': fight.get('date'),
                'opponent_id': fighter1_id,
                'opponent_name': fight.get('fighter1_name'),
                'result': 'no_contest',
                'old_elo': fighter2_elo,
                'new_elo': fighter2_elo,  # No change
                'event': fight.get('event_name'),
                'method': fight.get('method'),
                'fight_id': fight.get('id')
            })
            
        elif result_type == 'win' and winner_id:
            # Regular win/loss scenario
            # Determine winner and loser
            if winner_id == fighter1_id:
                winner_id, loser_id = fighter1_id, fighter2_id
                winner_elo, loser_elo = fighter1_elo, fighter2_elo
            else:
                winner_id, loser_id = fighter2_id, fighter1_id
                winner_elo, loser_elo = fighter2_elo, fighter1_elo
            
            # Calculate new ELO ratings
            new_winner_elo, new_loser_elo = calculate_elo(winner_elo, loser_elo)
            
            # Update ELO ratings
            fighter_elos[winner_id] = new_winner_elo
            fighter_elos[loser_id] = new_loser_elo
            
            # Record fight in fighter history
            fighter_history[winner_id].append({
                'date': fight.get('date'),
                'opponent_id': loser_id,
                'opponent_name': fight.get('fighter1_name') if winner_id == fighter2_id else fight.get('fighter2_name'),
                'result': 'win',
                'old_elo': winner_elo,
                'new_elo': new_winner_elo,
                'event': fight.get('event_name'),
                'method': fight.get('method'),
                'fight_id': fight.get('id')
            })
            
            fighter_history[loser_id].append({
                'date': fight.get('date'),
                'opponent_id': winner_id,
                'opponent_name': fight.get('fighter1_name') if loser_id == fighter2_id else fight.get('fighter2_name'),
                'result': 'loss',
                'old_elo': loser_elo,
                'new_elo': new_loser_elo,
                'event': fight.get('event_name'),
                'method': fight.get('method'),
                'fight_id': fight.get('id')
            })
        else:
            print(f"Skipping fight with unknown result type: {result_type} for fight {fight.get('id')}")
    
    return fighter_elos, fighter_history

def main():
    """
    Main function to calculate ELO ratings from scraped data
    """
    print("\n" + "="*60)
    print("CALCULATING ELO RATINGS")
    print("="*60)
    
    # Check if data files exist
    if not os.path.exists('data/fighters.json'):
        print("❌ Error: data/fighters.json not found")
        print("Please run the scraper first to generate fighter data")
        return
    
    if not os.path.exists('data/fights.json'):
        print("❌ Error: data/fights.json not found")
        print("Please run the scraper first to generate fight data")
        return
    
    # Load fighter and fight data
    print("\nLoading fighter data...")
    with open('data/fighters.json', 'r', encoding='utf-8') as f:
        fighters = json.load(f)
    print(f"Loaded {len(fighters)} fighters")
    
    print("\nLoading fight data...")
    with open('data/fights.json', 'r', encoding='utf-8') as f:
        fights = json.load(f)
    print(f"Loaded {len(fights)} fights")
    
    # Calculate ELO ratings
    print("\nProcessing fights and calculating ELO ratings...")
    fighter_elos, fighter_history = process_fights_and_calculate_elo(fights)
    
    # Create a DataFrame with fighter ELO ratings
    fighter_elo_data = []
    for fighter_id, elo_rating in fighter_elos.items():
        # Find fighter name
        fighter_name = None
        for fighter in fighters:
            if fighter.get('id') == fighter_id:
                fighter_name = fighter.get('name')
                break
        
        if fighter_name:
            fighter_elo_data.append({
                'fighter_id': fighter_id,
                'name': fighter_name,
                'elo': elo_rating,
                'fight_count': len(fighter_history.get(fighter_id, []))
            })
    
    # Create DataFrame and sort by ELO
    if fighter_elo_data:
        elo_df = pd.DataFrame(fighter_elo_data)
        elo_df = elo_df.sort_values(by='elo', ascending=False)
        
        # Save ELO ratings to CSV
        elo_df.to_csv('data/fighter_elo_ratings.csv', index=False)
        
        print(f"\n✅ ELO ratings calculated for {len(fighter_elos)} fighters")
        print(f"✅ Results saved to data/fighter_elo_ratings.csv")
        
        # Print top fighters by ELO
        top_count = min(10, len(elo_df))
        print(f"\n🏆 Top {top_count} Fighters by ELO Rating:")
        print(elo_df.head(top_count).to_string(index=False))
    else:
        print("\n❌ No valid fighter data found for ELO calculation")
    
    # Save fighter history
    with open('data/fighter_history.json', 'w', encoding='utf-8') as f:
        json.dump(fighter_history, f, indent=2)
    print(f"\n✅ Fighter history saved to data/fighter_history.json")
    
    print("\n" + "="*60)
    print("ELO CALCULATION COMPLETE")
    print("="*60)

if __name__ == "__main__":
    main()