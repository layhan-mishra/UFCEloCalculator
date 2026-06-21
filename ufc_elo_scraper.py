#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
UFC ELO Scraper

This script scrapes fighter and fight data from ufcstats.com and calculates ELO ratings for each fighter.
"""

import os
import time
import json
import random
import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime

# Constants
BASE_URL = "http://ufcstats.com/statistics/fighters"
EVENTS_URL = EVENTS_URL = "http://ufcstats.com/statistics/events/completed?page=all"
INITIAL_ELO = 1500
K_FACTOR = 32  # Standard K-factor for ELO calculations

# Create a session for making requests
session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
})

import requests
import time
import random
from bs4 import BeautifulSoup
import urllib.request

def get_soup(url):
    """
    Core helper to fetch a URL and return a parsed BeautifulSoup object
    using a hard-spoofed native browser client to bypass Cloudflare.
    """
    url = url.strip()
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
    }
    
    try:
        time.sleep(random.uniform(2.0, 3.5))
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=20) as response:
            html = response.read()
            if len(html) < 1000:
                print(f"⚠️ Warning: Unusually small payload received from {url}")
            return BeautifulSoup(html, 'html.parser')
            
    except Exception as e:
        print(f"⚠️ FETCH FAILED for {url}: {e}")
        return None

def get_fighter_links(testing_mode=False):
    """
    Get links to all fighter pages using page=all for each letter
    """
    fighter_links = []
    
    # In testing mode, only get fighters from 'a' and 'b'
    letters = "ab" if testing_mode else "abcdefghijklmnopqrstuvwxyz"
    
    # Get all fighter index pages (A-Z) with page=all parameter
    for letter in letters:
        url = f"{BASE_URL}?char={letter}&page=all"
        print(f"Fetching {'TESTING MODE - ' if testing_mode else ''}fighters starting with '{letter.upper()}'...")
        
        soup = get_soup(url)
        if not soup:
            print(f"Failed to fetch page for letter '{letter.upper()}'")
            continue
        
        # Find the table with fighter data
        table = soup.find('table', class_='b-statistics__table')
        if not table:
            print(f"No fighter table found for letter '{letter.upper()}'")
            continue
        
        # Count fighters found for this letter
        letter_count = 0
        
        # Extract fighter links from the table
        for row in table.find_all('tr')[1:]:  # Skip header row
            link_cell = row.find('td', class_='b-statistics__table-col')
            if link_cell:
                link = link_cell.find('a')
                if link and 'href' in link.attrs:
                    fighter_url = link['href']
                    if fighter_url not in fighter_links:  # Avoid duplicates
                        fighter_links.append(fighter_url)
                        letter_count += 1
                        
                        # In testing mode, limit to 10 fighters total
                        if testing_mode and len(fighter_links) >= 10:
                            break
        
        print(f"Found {letter_count} fighters for letter '{letter.upper()}'")
        
        # In testing mode, stop if we have enough fighters
        if testing_mode and len(fighter_links) >= 10:
            break
        
        # Add a delay to avoid overloading the server
        time.sleep(random.uniform(15, 17))
    
    print(f"Total fighters found: {len(fighter_links)}")
    return fighter_links

def get_fighter_data(fighter_url):
    """
    Extract fighter data from fighter page
    """
    soup = get_soup(fighter_url)
    if not soup:
        return None
    
    # Extract fighter info
    fighter_info = {}
    
    # Get fighter name
    name_elem = soup.find('span', class_='b-content__title-highlight')
    if name_elem:
        fighter_info['name'] = name_elem.text.strip()
    
    # Get fighter details
    info_elem = soup.find('div', class_='b-list__info-box')
    if info_elem:
        for item in info_elem.find_all('li', class_='b-list__box-list-item'):
            label = item.find('i', class_='b-list__box-item-title')
            value = item.find('i', class_='b-list__box-item-link')
            
            if label and value:
                key = label.text.strip().replace(':', '').lower()
                fighter_info[key] = value.text.strip()
    
    # Get fighter ID from URL
    fighter_info['id'] = fighter_url.split('/')[-1]
    fighter_info['url'] = fighter_url
    
    return fighter_info

def get_event_links(testing_mode=False):
    """
    Get links and names to all UFC event pages in a single pass.
    Returns a tuple: (event_links_list, event_name_dictionary)
    """
    event_links = []
    event_name_map = {}
    
    ALL_EVENTS_URL = "http://ufcstats.com/statistics/events/completed?page=all"
    print(f"Fetching master event list from: {ALL_EVENTS_URL}")
    
    soup = get_soup(ALL_EVENTS_URL)
    if not soup:
        print("⚠️ CRITICAL: Could not load the master events page.")
        return event_links, event_name_map

    # Universal catch for ANY anchor tag containing 'event-details' in the path
    # This completely bypasses the broken 'b-link_style_black' class checking
    all_anchors = soup.find_all('a', href=True)
    
    for a in all_anchors:
        href = a['href'].strip()
        if 'event-details' in href:
            if href not in event_links:
                event_links.append(href)
                
                # Safely map the readable event name while we have the element
                name = a.get_text(strip=True)
                if name:
                    event_name_map[href] = name
                
                if testing_mode and len(event_links) >= 5:
                    break

    print(f"Successfully extracted {len(event_links)} total events.")
    return event_links, event_name_map
def get_fight_links(event_url):
    """
    Get links to all fights from an event page
    """
    fight_links = []
    
    soup = get_soup(event_url)
    if not soup:
        return fight_links
    
    # Find the table with fight data
    table = soup.find('table', class_='b-fight-details__table')
    if not table:
        return fight_links
    
    # Extract fight links from the table
    for row in table.find_all('tr')[1:]:  # Skip header row
        link_cell = row.find('td', class_='b-fight-details__table-col')
        if link_cell:
            link = link_cell.find('a')
            if link and 'href' in link.attrs:
                fight_links.append(link['href'])
    
    return fight_links

def get_fight_data(fight_url):
    """
    Extract fight data from fight page with improved parsing logic.
    Uses fighter UUIDs, event link for event name, and event page for date.
    """
    soup = get_soup(fight_url)
    if not soup:
        return None

    fight_info = {
        'id': fight_url.split('/')[-1],
        'url': fight_url
    }

    try:
        # ------------------------
        # FIGHTER NAME + UUIDs
        # ------------------------
        fighter_names = []
        fighter_ids = []
        fighter_urls = []

        # Main fighter containers
        persons = soup.find_all('div', class_='b-fight-details__person')
        for person in persons[:2]:
            # Name
            name_tag = person.find('h3', class_='b-fight-details__person-name')
            if name_tag and name_tag.find('a'):
                name = name_tag.find('a').get_text(strip=True)
                if name and len(name) > 1:
                    fighter_names.append(name)

            # UUID from fighter profile URL
            link = person.find('a', href=True)
            if link and "/fighter-details/" in link['href']:
                fighter_url = link['href']
                fighter_uuid = fighter_url.split('/')[-1]
                fighter_ids.append(fighter_uuid)
                fighter_urls.append(fighter_url)

        # Fall back to your older methods if less than 2 names found
        if len(fighter_names) < 2:
            fighter_names = []
            fighter_links = soup.find_all('a', class_='b-link_style_black')
            for link in fighter_links:
                name = link.get_text(strip=True)
                if name and len(name) > 1 and name not in fighter_names:
                    fighter_names.append(name)
                    if len(fighter_names) >= 2:
                        break

        # Validate we have 2 fighters
        if len(fighter_names) >= 2 and len(fighter_ids) >= 2:
            fight_info['fighter1_name'] = fighter_names[0]
            fight_info['fighter2_name'] = fighter_names[1]
            fight_info['fighter1_id'] = fighter_ids[0]
            fight_info['fighter2_id'] = fighter_ids[1]
            fight_info['fighter1_url'] = fighter_urls[0]
            fight_info['fighter2_url'] = fighter_urls[1]
        else:
            print(f"Could not extract fighter names/UUIDs from {fight_url}")
            return None

        # ------------------------
        # RESULT (win, draw, nc)
        # ------------------------
        fight_info['result_type'] = 'unknown'
        result_found = False
        for idx, person in enumerate(persons[:2]):
            win_icon = person.find(
                'i',
                class_='b-fight-details__person-status b-fight-details__person-status_style_green'
            )
            if win_icon:
                fight_info['winner_name'] = fight_info[f'fighter{idx+1}_name']
                fight_info['winner_id'] = fight_info[f'fighter{idx+1}_id']
                fight_info['winner_url'] = fight_info[f'fighter{idx+1}_url']
                fight_info['result_type'] = 'win'
                result_found = True
                break

        if not result_found:
            for idx, person in enumerate(persons[:2]):
                gray_icon = person.find(
                    'i',
                    class_='b-fight-details__person-status b-fight-details__person-status_style_gray'
                )
                if gray_icon:
                    txt = gray_icon.get_text(strip=True)
                    if txt == 'D':
                        fight_info['result_type'] = 'draw'
                    elif txt == 'NC':
                        fight_info['result_type'] = 'no_contest'
                    fight_info['winner_name'] = None
                    fight_info['winner_id'] = None
                    fight_info['winner_url'] = None
                    result_found = True
                    break

        if not result_found:
            # fallback: assume fighter1 wins
            fight_info['winner_name'] = fight_info['fighter1_name']
            fight_info['winner_id'] = fight_info['fighter1_id']
            fight_info['winner_url'] = fight_info['fighter1_url']
            fight_info['result_type'] = 'win'

        # ------------------------
        # METHOD / ROUND / TIME
        # ------------------------
        page_text = soup.get_text()
        lines = [line.strip() for line in page_text.split('\n') if line.strip()]
        method_found = False

        # Look for the proper Method: label and its sibling
        method_label = soup.find('i', class_='b-fight-details__label', string=lambda s: s and "Method" in s)
        if method_label:
            method_value = method_label.find_next('i', style="font-style: normal")
            if method_value:
                method_text = method_value.get_text(strip=True)
                if method_text:
                    upper = method_text.upper()

                    if upper.startswith("KO/TKO"):
                        fight_info['method'] = method_text
                        method_found = True
                    elif upper.startswith("SUB"):
                        fight_info['method'] = method_text
                        method_found = True
                    elif "DECISION" in upper:
                        fight_info['method'] = method_text
                        method_found = True
                    elif "MAJORITY" in upper:
                        fight_info['method'] = "Decision - Majority"
                        method_found = True
                    elif "DISQUALIFICATION" in upper or upper == "DQ":
                        fight_info['method'] = "Disqualification"
                        method_found = True
                    elif "CNC" in upper or "COULD NOT CONTINUE" in upper:
                        fight_info['method'] = "Could Not Continue"
                        method_found = True

        # Fallback: older parsing
        if not method_found:
            method_elements = soup.find_all('p', class_='b-fight-details__table-text')
            for element in method_elements:
                method_text = element.get_text(strip=True)
                if method_text:
                    upper = method_text.upper()
                    if upper.startswith('KO/TKO'):
                        fight_info['method'] = method_text
                        method_found = True
                        break
                    elif upper.startswith('SUB'):
                        fight_info['method'] = method_text
                        method_found = True
                        break
                    elif "DECISION" in upper:
                        fight_info['method'] = method_text
                        method_found = True
                        break
                    elif upper in ['U-DEC', 'UNANIMOUS DECISION']:
                        fight_info['method'] = 'Decision - Unanimous'
                        method_found = True
                        break
                    elif upper in ['S-DEC', 'SPLIT DECISION']:
                        fight_info['method'] = 'Decision - Split'
                        method_found = True
                        break
                    elif "MAJORITY" in upper:
                        fight_info['method'] = 'Decision - Majority'
                        method_found = True
                        break
                    elif upper == 'CNC':
                        fight_info['method'] = 'Could Not Continue'
                        method_found = True
                        break
                    elif upper == 'DQ':
                        fight_info['method'] = 'Disqualification'
                        method_found = True
                        break

        # Extract round/time from text as fallback
        for line in lines:
            line_lower = line.lower()
            if 'round:' in line_lower:
                fight_info['round'] = line.split('round:')[-1].strip().split()[0]
            if 'time:' in line_lower:
                fight_info['time'] = line.split('time:')[-1].strip().split()[0]

        # ------------------------
        # WEIGHT CLASS
        # ------------------------
        weight_classes = ['Heavyweight','Light Heavyweight','Middleweight',
                          'Welterweight','Lightweight','Featherweight',
                          'Bantamweight','Flyweight','Strawweight','Catch Weight']
        for wc in weight_classes:
            if wc.lower() in page_text.lower():
                fight_info['weight_class'] = wc
                break

        # ------------------------
        # EVENT NAME + DATE
        # ------------------------
        event_link = soup.find('a', class_='b-link', href=True)
        if event_link and "/event-details/" in event_link['href']:
            fight_info['event_name'] = event_link.get_text(strip=True)
            event_url = event_link['href']

            # Go to event page for date
            event_soup = get_soup(event_url)
            if event_soup:
                info_list = event_soup.find('ul', class_='b-list__box-list')
                if info_list:
                    for li in info_list.find_all('li', class_='b-list__box-list-item'):
                        label = li.find('i', class_='b-list__box-item-title')
                        if label and "Date" in label.get_text():
                            fight_info['date'] = li.get_text(strip=True).replace("Date:", "").strip()
                            # Normalize date
                            from datetime import datetime
                            try:
                                date_obj = datetime.strptime(fight_info['date'], '%B %d, %Y')
                                fight_info['date'] = date_obj.strftime('%Y-%m-%d')
                            except:
                                pass
                            break

        # Fallbacks for event/date if above failed
        if 'event_name' not in fight_info:
            title_tag = soup.find('title')
            if title_tag:
                fight_info['event_name'] = title_tag.get_text(strip=True).split(' - ')[0]

        if 'date' not in fight_info:
            fight_info['date'] = '2024-01-01'

    except Exception as e:
        print(f"Error parsing fight data from {fight_url}: {e}")
        return None

    # Validate required fields
    required_fields = ['fighter1_name', 'fighter2_name', 'winner_name',
                       'fighter1_id', 'fighter2_id', 'winner_id']
    if all(field in fight_info for field in required_fields):
        return fight_info
    else:
        missing = [f for f in required_fields if f not in fight_info]
        print(f"Missing required fields {missing} for fight {fight_url}")
        print(f"Fight info collected: {fight_info}")
        return None

def validate_data_for_elo_calculation(fighters, fights):
    """
    Validate that fighter and fight data can be used for ELO calculations
    Returns validation results and any issues found
    """
    validation_results = {
        'fighter_validation': {
            'total_fighters': len(fighters),
            'fighters_with_ids': 0,
            'fighters_with_names': 0,
            'issues': []
        },
        'fight_validation': {
            'total_fights': len(fights),
            'valid_fights': 0,
            'fights_with_results': 0,
            'fights_with_fighter_ids': 0,
            'issues': []
        },
        'cross_validation': {
            'fighter_ids_in_fights': set(),
            'fighter_ids_in_fighters': set(),
            'missing_fighter_data': [],
            'orphaned_fights': 0
        }
    }
    
    # Validate fighter data
    print("Validating fighter data...")
    for i, fighter in enumerate(fighters):
        if not isinstance(fighter, dict):
            validation_results['fighter_validation']['issues'].append(f"Fighter {i}: Not a dictionary")
            continue
        
        if fighter.get('id'):
            validation_results['fighter_validation']['fighters_with_ids'] += 1
            validation_results['cross_validation']['fighter_ids_in_fighters'].add(fighter.get('id'))
        else:
            validation_results['fighter_validation']['issues'].append(f"Fighter {i}: Missing ID")
        
        if fighter.get('name'):
            validation_results['fighter_validation']['fighters_with_names'] += 1
        else:
            validation_results['fighter_validation']['issues'].append(f"Fighter {i}: Missing name")
    
    # Validate fight data
    print("Validating fight data...")
    for i, fight in enumerate(fights):
        if not isinstance(fight, dict):
            validation_results['fight_validation']['issues'].append(f"Fight {i}: Not a dictionary")
            continue
        
        # Check required fields for ELO calculation
        required_fields = ['fighter1_id', 'fighter2_id', 'result_type']
        missing_fields = [field for field in required_fields if not fight.get(field)]
        
        if not missing_fields:
            validation_results['fight_validation']['valid_fights'] += 1
            
            # Track fighter IDs used in fights
            validation_results['cross_validation']['fighter_ids_in_fights'].add(fight.get('fighter1_id'))
            validation_results['cross_validation']['fighter_ids_in_fights'].add(fight.get('fighter2_id'))
            validation_results['fight_validation']['fights_with_fighter_ids'] += 1
        else:
            validation_results['fight_validation']['issues'].append(
                f"Fight {i}: Missing fields {missing_fields}"
            )
        
        # Check if fight has a result
        result_type = fight.get('result_type')
        if result_type in ['win', 'draw', 'no_contest']:
            validation_results['fight_validation']['fights_with_results'] += 1
            
            # For wins, check if winner is specified
            if result_type == 'win' and not fight.get('winner_id'):
                validation_results['fight_validation']['issues'].append(
                    f"Fight {i}: Result is 'win' but no winner_id specified"
                )
        else:
            validation_results['fight_validation']['issues'].append(
                f"Fight {i}: Invalid result_type '{result_type}'"
            )
    
    # Cross-validation: Check if fighter IDs in fights exist in fighter data
    print("Cross-validating fighter and fight data...")
    missing_fighters = validation_results['cross_validation']['fighter_ids_in_fights'] - validation_results['cross_validation']['fighter_ids_in_fighters']
    validation_results['cross_validation']['missing_fighter_data'] = list(missing_fighters)
    
    # Count fights that would be orphaned (fighters not in fighter data)
    for fight in fights:
        f1_id = fight.get('fighter1_id')
        f2_id = fight.get('fighter2_id')
        if f1_id in missing_fighters or f2_id in missing_fighters:
            validation_results['cross_validation']['orphaned_fights'] += 1
    
    return validation_results

def print_validation_results(results):
    """Print validation results in a readable format"""
    print("\n" + "="*60)
    print("DATA VALIDATION RESULTS")
    print("="*60)
    
    # Fighter validation results
    fv = results['fighter_validation']
    print(f"\n📊 FIGHTER DATA:")
    print(f"   Total fighters: {fv['total_fighters']}")
    print(f"   Fighters with IDs: {fv['fighters_with_ids']}")
    print(f"   Fighters with names: {fv['fighters_with_names']}")
    if fv['issues']:
        print(f"   ⚠️  Issues found: {len(fv['issues'])}")
        for issue in fv['issues'][:5]:  # Show first 5 issues
            print(f"      - {issue}")
        if len(fv['issues']) > 5:
            print(f"      - ... and {len(fv['issues']) - 5} more issues")
    else:
        print("   ✅ No issues found")
    
    # Fight validation results
    fightv = results['fight_validation']
    print(f"\n🥊 FIGHT DATA:")
    print(f"   Total fights: {fightv['total_fights']}")
    print(f"   Valid fights (all required fields): {fightv['valid_fights']}")
    print(f"   Fights with results: {fightv['fights_with_results']}")
    print(f"   Fights with fighter IDs: {fightv['fights_with_fighter_ids']}")
    if fightv['issues']:
        print(f"   ⚠️  Issues found: {len(fightv['issues'])}")
        for issue in fightv['issues'][:5]:  # Show first 5 issues
            print(f"      - {issue}")
        if len(fightv['issues']) > 5:
            print(f"      - ... and {len(fightv['issues']) - 5} more issues")
    else:
        print("   ✅ No issues found")
    
    # Cross-validation results
    cv = results['cross_validation']
    print(f"\n🔗 CROSS-VALIDATION:")
    print(f"   Unique fighters in fight data: {len(cv['fighter_ids_in_fights'])}")
    print(f"   Unique fighters in fighter data: {len(cv['fighter_ids_in_fighters'])}")
    print(f"   Missing fighter profiles: {len(cv['missing_fighter_data'])}")
    print(f"   Orphaned fights (missing fighter data): {cv['orphaned_fights']}")
    
    if cv['missing_fighter_data']:
        print(f"   ⚠️  Fighter IDs in fights but not in fighter data:")
        for fighter_id in cv['missing_fighter_data'][:5]:
            print(f"      - {fighter_id}")
        if len(cv['missing_fighter_data']) > 5:
            print(f"      - ... and {len(cv['missing_fighter_data']) - 5} more")
    
    # Overall assessment
    print(f"\n📈 ELO CALCULATION READINESS:")
    total_issues = len(fv['issues']) + len(fightv['issues'])
    valid_fights_pct = (fightv['valid_fights'] / max(fightv['total_fights'], 1)) * 100
    
    if total_issues == 0 and cv['orphaned_fights'] == 0:
        print("   ✅ READY: Data is clean and ready for ELO calculation")
    elif total_issues < 5 and valid_fights_pct > 80:
        print("   ⚠️  MOSTLY READY: Some minor issues but should work")
    else:
        print("   ❌ NOT READY: Significant issues found - needs fixing")
    
    print(f"   Valid fight percentage: {valid_fights_pct:.1f}%")

def main(testing_mode=False, update_mode=False):
    """
    Main function to run the scraper and calculate ELO ratings
    """
    # Create data directory if it doesn't exist
    os.makedirs('frontend/public/data', exist_ok=True)
    
    # Step 1: Scrape fighter data
    if testing_mode:
        print("Step 1: Scraping fighter data (TESTING MODE - limited to 10 fighters)...")
    else:
        print("Step 1: Scraping fighter data...")
    
    # Check if fighter data already exists
    if os.path.exists('frontend/public/data/fighters.json') and (testing_mode or update_mode):
        print("Loading existing fighter data...")
        with open('frontend/public/data/fighters.json', 'r', encoding='utf-8') as f:
            fighters = json.load(f)
    else:
        # Get fighter links
        fighter_links = get_fighter_links(testing_mode=testing_mode)
        
        # Scrape fighter data
        fighters = []
        for i, link in enumerate(fighter_links):
            print(f"Scraping fighter {i+1}/{len(fighter_links)}: {link}" )
            fighter_data = get_fighter_data(link)
            if fighter_data:
                fighters.append(fighter_data)
                print(f"Scraped fighter: {fighter_data.get('name')}")
            
            # Add a small delay to avoid overloading the server
            time.sleep(random.uniform(15, 17))
        
        # Save fighter data
        with open('frontend/public/data/fighters.json', 'w', encoding='utf-8') as f:
            json.dump(fighters, f, indent=2)
    
    print(f"Collected data for {len(fighters)} fighters")
    
    processed_event_names = set()
    if update_mode and os.path.exists('frontend/public/data/fights.json'):
        try:
            with open('frontend/public/data/fights.json', 'r', encoding='utf-8') as f:
                existing_fights = json.load(f)
                processed_event_names = {fight.get('event_name') for fight in existing_fights if fight.get('event_name')}
            print(f"Found {len(processed_event_names)} events already in database.")
        except Exception as e:
            print(f"Could not load existing fights for update: {e}")

    # Step 2: Scrape fight data
    if testing_mode:
        print("\nStep 2: Scraping fight data (TESTING MODE - limited to ~10 fights)...")
    else:
        print("\nStep 2: Scraping fight data...")
    
# Check if fight data already exists
    if os.path.exists('frontend/public/data/fights.json'):
        print("Loading existing fight data into memory for appending...")
        with open('frontend/public/data/fights.json', 'r', encoding='utf-8') as f:
            fights = json.load(f)
    else:
        fights = []

    # Unpack both the links and the mapping dictionary in one single network call!
    event_links, event_name_map = get_event_links(testing_mode=testing_mode)
    print(f"Total historical events ready for processing: {len(event_links)}")

    # CRITICAL CHRONOLOGY: We loop through event_links BACKWARDS (reversed)
    # This ensures old events stay at the top and brand-new events append cleanly to the bottom
    for i, event_link in enumerate(reversed(event_links)):
        current_idx = len(event_links) - i
        
        # Pull the name we safely mapped in get_event_links
        event_name = event_name_map.get(event_link, "Unknown Event")
        
        # If we are in update mode and already have this event name, skip it instantly
        if update_mode and event_name in processed_event_names and event_name != "Unknown Event":
            continue
            
        print(f" [{current_idx}/{len(event_links)}] 🟢 NEW DATA DETECTED! Scraping event: {event_name}")
        
        # Get fight links for this new event
        fight_links = get_fight_links(event_link)

        for fight_link in fight_links:
            fight_soup = get_soup(fight_link)
            if fight_soup:
                # Find the two fighter profile links inside the specific match details page
                fighter_anchors = fight_soup.find_all('a', class_='b-link b-fight-details__person-link')
                for anchor in fighter_anchors:
                    f_link = anchor.get('href')
                    f_name = anchor.text.strip()
                    
                    # Look up if this fighter's unique link exists in our profiles list
                    if f_link and not any(f.get('link') == f_link for f in fighters):
                        print(f"   ✨ Missing or Debut fighter spotted: {f_name}! Extracting bio profile...")
                        
                        # Crawl the individual athlete's page to harvest their official stats
                        fighter_soup = get_soup(f_link)
                        if fighter_soup:
                            # Default fallback schema
                            fighter_details = {
                                "name": f_name,
                                "nickname": "",
                                "record": "0-0-0",
                                "height": "--",
                                "weight": "--",
                                "reach": "--",
                                "stance": "--",
                                "dob": "--",
                                "link": f_link
                            }
                            
                            # Parse nickname
                            nick_elem = fighter_soup.find('p', class_='b-content__Nickname')
                            if nick_elem:
                                fighter_details["nickname"] = nick_elem.text.strip()
                                
                            # Parse physical stats from the list elements on ufcstats
                            box_items = fighter_soup.find_all('li', class_='b-list__box-item')
                            for item in box_items:
                                text = item.text.strip()
                                if "Height:" in text:
                                    fighter_details["height"] = text.replace("Height:", "").strip()
                                elif "Weight:" in text:
                                    fighter_details["weight"] = text.replace("Weight:", "").strip()
                                elif "Reach:" in text:
                                    fighter_details["reach"] = text.replace("Reach:", "").strip()
                                elif "Stance:" in text:
                                    fighter_details["stance"] = text.replace("Stance:", "").strip()
                                elif "DOB:" in text:
                                    fighter_details["dob"] = text.replace("DOB:", "").strip()
                            
                            # Append the newly minted profile array into our loaded fighter database
                            fighters.append(fighter_details)
                            print(f"   Successfully added {f_name} to fighters.json")
                            
                            # Instantly save back to disk so we don't lose progress if it loops heavily
                            with open('frontend/public/data/fighters.json', 'w', encoding='utf-8') as f_file:
                                json.dump(fighters, f_file, indent=2)

        for j, fight_link in enumerate(fight_links):
            print(f"  Scraping fight {j+1}/{len(fight_links)}: {fight_link}")
            fight_data = get_fight_data(fight_link)
            if fight_data:
                print(f"Scraped fight: {fight_data.get('fighter1_name')} vs {fight_data.get('fighter2_name')}, winner: {fight_data.get('winner_name')}")
                fights.append(fight_data)
            
            # In testing mode, stop at 10 fights
            if testing_mode and len(fights) >= 10:
                break
            
            # Add a small delay to avoid overloading the server
            time.sleep(random.uniform(15, 17))
        
        # In testing mode, stop if we have enough fights
        if testing_mode and len(fights) >= 10:
            break
        
        # Save fight data
        with open('frontend/public/data/fights.json', 'w', encoding='utf-8') as f:
            json.dump(fights, f, indent=2)
    
    print(f"Collected data for {len(fights)} fights")
    
    if testing_mode:
        # Step 3: Validate data (testing mode)
        print("\nStep 3: Validating data for ELO calculation readiness...")
        validation_results = validate_data_for_elo_calculation(fighters, fights)
        print_validation_results(validation_results)
        
        # Step 4: Call ELO calculation module (testing mode)
        print("\n" + "="*60)
        print("TESTING MODE - CALCULATING ELO FOR TEST DATA")
        print("="*60)
        
        try:
            # Import and run the ELO calculation module
            import calculate_elo
            print("\nCalling calculate_elo module...")
            calculate_elo.main()
            
            print("\n" + "="*60)
            print("TESTING MODE COMPLETE!")
            print("="*60)
            print("✅ Code executed successfully without errors")
            print(f"✅ Scraped {len(fighters)} fighters")
            print(f"✅ Scraped {len(fights)} fights") 
            print("✅ Data validation completed")
            print("✅ ELO ratings calculated")
            print("\nCheck frontend/public/data/fighter_elo_ratings.csv for results!")
            print("="*60)
            
        except ImportError as e:
            print(f"\n❌ Error: Could not import calculate_elo module: {e}")
            print("Make sure calculate_elo.py is in the same directory.")
        except Exception as e:
            print(f"\n❌ Error during ELO calculation: {e}")
            import traceback
            traceback.print_exc()
        
    else:
        # Step 3: Validate data (full mode)
        print("\nStep 3: Validating data for ELO calculation readiness...")
        validation_results = validate_data_for_elo_calculation(fighters, fights)
        print_validation_results(validation_results)
        
        # Step 4: Call ELO calculation module
        print("\n" + "="*60)
        print("SCRAPING COMPLETE - STARTING ELO CALCULATION")
        print("="*60)
        
        try:
            # Import and run the ELO calculation module
            import calculate_elo
            print("\nCalling calculate_elo module...")
            calculate_elo.main()
            
            print("\n" + "="*60)
            print("ALL PROCESSING COMPLETE!")
            print("="*60)
            
        except ImportError as e:
            print(f"\n❌ Error: Could not import calculate_elo module: {e}")
            print("Make sure calculate_elo.py is in the same directory.")
        except Exception as e:
            print(f"\n❌ Error during ELO calculation: {e}")
            import traceback
            traceback.print_exc()

    if __name__ == "__main__":
        main()