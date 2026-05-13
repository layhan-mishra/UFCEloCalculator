#!/bin/bash

echo "UFC ELO Scraper"
echo "==============="
echo

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "Failed to create virtual environment."
        echo "Please make sure Python 3 is installed."
        read -p "Press Enter to exit..."
        exit 1
    fi
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "Failed to activate virtual environment."
    read -p "Press Enter to exit..."
    exit 1
fi

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Failed to install requirements."
    read -p "Press Enter to exit..."
    exit 1
fi

echo
echo "Virtual environment is ready."
echo

# Function to check if data files exist
check_data_exists() {
    if [ -f "data/fighter_elo_ratings.csv" ] && [ -f "data/fighters.json" ] && [ -f "data/fights.json" ]; then
        return 0  # Data exists
    else
        return 1  # No data
    fi
}

# Menu function
show_menu() {
    echo "What would you like to do?"
    echo "1. Run UFC ELO scraper (FULL MODE - this will take several hours)"
    echo "2. Run UFC ELO scraper (TESTING MODE - quick test with limited data)"
    
    if check_data_exists; then
        echo "3. View results (existing data found)"
        echo "4. Generate visualizations (existing data found)"
        echo "5. Clean existing data and start fresh"
        echo "6. Exit"
    else
        echo "3. Generate visualizations (requires data - run scraper first)"
        echo "4. Exit"
    fi
    echo
}

# Function to run scraper in testing mode
run_testing_mode() {
    echo
    echo "=========================================="
    echo "RUNNING IN TESTING MODE"
    echo "=========================================="
    echo "This will:"
    echo "- Scrape only the first 10 fighters (from A-B names)"
    echo "- Scrape only ~10 fights from recent events"
    echo "- Test all parsing and ELO calculation logic"
    echo "- Complete in 5-10 minutes instead of hours"
    echo "- Validate that the full scraper will work"
    echo
    read -p "Continue with testing mode? (y/n): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo
        echo "Starting testing mode..."
        python -c "
import sys
sys.path.append('.')
from ufc_elo_scraper import main
main(testing_mode=True)
"
        if [ $? -eq 0 ]; then
            echo
            echo "=========================================="
            echo "✅ TESTING MODE COMPLETED SUCCESSFULLY!"
            echo "=========================================="
            echo "The code executed without errors and:"
            echo "✅ Successfully scraped fighter data"
            echo "✅ Successfully scraped fight data"
            echo "✅ Successfully calculated ELO ratings"
            echo "✅ All data validation passed"
            echo
            echo "You can now confidently run the full scraper!"
            echo "=========================================="
        else
            echo
            echo "❌ Testing mode failed. Please check the errors above."
        fi
    else
        echo "Testing mode cancelled."
    fi
}

# Function to run full scraper
run_full_scraper() {
    echo
    echo "=========================================="
    echo "⚠️  WARNING: FULL MODE SELECTED"
    echo "=========================================="
    echo "This will:"
    echo "- Scrape ALL UFC fighters (~1000+ fighters)"
    echo "- Scrape ALL UFC fights (~10,000+ fights)"
    echo "- Take several HOURS to complete"
    echo "- Make thousands of requests to ufcstats.com"
    echo
    echo "Make sure you have:"
    echo "- Stable internet connection"
    echo "- Several hours of free time"
    echo "- Tested the code first (option 2)"
    echo
    read -p "Are you sure you want to continue? (y/n): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo
        echo "Starting full scraper..."
        echo "This will take a long time. Please be patient..."
        python run_scraper.py
    else
        echo "Full scraper cancelled."
    fi
}

# Function to clean existing data
clean_data() {
    echo
    echo "This will delete all existing scraped data:"
    echo "- data/fighters.json"
    echo "- data/fights.json"
    echo "- data/fighter_elo_ratings.csv"
    echo "- data/fighter_history.json"
    echo
    read -p "Are you sure? (y/n): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        rm -f data/fighters.json data/fights.json data/fighter_elo_ratings.csv data/fighter_history.json
        echo "✅ Data cleaned successfully."
    else
        echo "Data cleaning cancelled."
    fi
}

# Main loop
while true; do
    show_menu
    
    if check_data_exists; then
        read -p "Enter your choice (1-6): " choice
        
        case $choice in
            1)
                run_full_scraper
                echo
                ;;
            2)
                run_testing_mode
                echo
                ;;
            3)
                echo
                echo "Viewing results..."
                python run_scraper.py
                echo
                ;;
            4)
                echo
                echo "Generating visualizations..."
                if [ -f "visualize_elo.py" ]; then
                    python visualize_elo.py
                else
                    echo "visualize_elo.py not found. Please make sure the file exists."
                fi
                echo
                ;;
            5)
                clean_data
                echo
                ;;
            6)
                echo
                echo "Exiting..."
                deactivate
                exit 0
                ;;
            *)
                echo
                echo "Invalid choice. Please try again."
                echo
                ;;
        esac
    else
        read -p "Enter your choice (1-4): " choice
        
        case $choice in
            1)
                run_full_scraper
                echo
                ;;
            2)
                run_testing_mode
                echo
                ;;
            3)
                echo
                echo "Generating visualizations..."
                if check_data_exists; then
                    if [ -f "visualize_elo.py" ]; then
                        python visualize_elo.py
                    else
                        echo "visualize_elo.py not found. Please make sure the file exists."
                    fi
                else
                    echo "❌ No data found. Please run the scraper first (option 1 or 2)."
                fi
                echo
                ;;
            4)
                echo
                echo "Exiting..."
                deactivate
                exit 0
                ;;
            *)
                echo
                echo "Invalid choice. Please try again."
                echo
                ;;
        esac
    fi
done