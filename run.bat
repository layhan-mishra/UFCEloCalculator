@echo off
echo UFC ELO Scraper
echo ===============
echo.

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Failed to create virtual environment.
        echo Please make sure Python is installed and in your PATH.
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate
if errorlevel 1 (
    echo Failed to activate virtual environment.
    pause
    exit /b 1
)

REM Install requirements
echo Installing requirements...
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo Failed to install requirements.
    pause
    exit /b 1
)

echo.
echo Virtual environment is ready.
echo.

:menu
REM Check if data files exist
set DATA_EXISTS=0
if exist "data\fighter_elo_ratings.csv" if exist "data\fighters.json" if exist "data\fights.json" set DATA_EXISTS=1

echo What would you like to do?
echo 1. Run UFC ELO scraper (FULL MODE - this will take several hours)
echo 2. Run UFC ELO scraper (TESTING MODE - quick test with limited data)

if %DATA_EXISTS%==1 (
    echo 3. View results (existing data found)
    echo 4. Generate visualizations (existing data found)
    echo 5. Clean existing data and start fresh
    echo 6. Exit
    echo.
    set /p choice=Enter your choice (1-6): 
)

if "%choice%"=="1" (
    call :run_full_scraper
    goto menu
) else if "%choice%"=="2" (
    call :run_testing_mode
    goto menu
) else if "%choice%"=="3" (
    if %DATA_EXISTS%==1 (
        echo.
        echo Viewing results...
        python run_scraper.py
        echo.
    ) else (
        echo.
        echo Generating visualizations...
        call :check_and_run_visualizations
        echo.
    )
    goto menu
) else if "%choice%"=="4" (
    if %DATA_EXISTS%==1 (
        echo.
        echo Generating visualizations...
        call :check_and_run_visualizations
        echo.
        goto menu
    ) else (
        echo.
        echo Exiting...
        deactivate
        exit /b 0
    )
) else if "%choice%"=="5" (
    if %DATA_EXISTS%==1 (
        call :clean_data
        goto menu
    ) else (
        echo.
        echo Invalid choice. Please try again.
        echo.
        goto menu
    )
) else if "%choice%"=="6" (
    if %DATA_EXISTS%==1 (
        echo.
        echo Exiting...
        deactivate
        exit /b 0
    ) else (
        echo.
        echo Invalid choice. Please try again.
        echo.
        goto menu
    )
) else (
    echo.
    echo Invalid choice. Please try again.
    echo.
    goto menu
)

:run_testing_mode
echo.
echo ==========================================
echo RUNNING IN TESTING MODE
echo ==========================================
echo This will:
echo - Scrape only the first 10 fighters (from A-B names)
echo - Scrape only ~10 fights from recent events
echo - Test all parsing and ELO calculation logic
echo - Complete in 5-10 minutes instead of hours
echo - Validate that the full scraper will work
echo.
set /p confirm=Continue with testing mode? (y/n): 

if /i "%confirm%"=="y" (
    echo.
    echo Starting testing mode...
    python -c "import sys; sys.path.append('.'); from ufc_elo_scraper import main; main(testing_mode=True)"
    if errorlevel 1 (
        echo.
        echo X Testing mode failed. Please check the errors above.
    ) else (
        echo.
        echo ==========================================
        echo √ TESTING MODE COMPLETED SUCCESSFULLY!
        echo ==========================================
        echo The code executed without errors and:
        echo √ Successfully scraped fighter data
        echo √ Successfully scraped fight data
        echo √ Successfully calculated ELO ratings
        echo √ All data validation passed
        echo.
        echo You can now confidently run the full scraper!
        echo ==========================================
    )
) else (
    echo Testing mode cancelled.
)
echo.
goto :eof

:run_full_scraper
echo.
echo ==========================================
echo ⚠️  WARNING: FULL MODE SELECTED
echo ==========================================
echo This will:
echo - Scrape ALL UFC fighters (~1000+ fighters)
echo - Scrape ALL UFC fights (~10,000+ fights)
echo - Take several HOURS to complete
echo - Make thousands of requests to ufcstats.com
echo.
echo Make sure you have:
echo - Stable internet connection
echo - Several hours of free time
echo - Tested the code first (option 2)
echo.
set /p confirm=Are you sure you want to continue? (y/n): 

if /i "%confirm%"=="y" (
    echo.
    echo Starting full scraper...
    echo This will take a long time. Please be patient...
    python run_scraper.py
) else (
    echo Full scraper cancelled.
)
echo.
goto :eof

:clean_data
echo.
echo This will delete all existing scraped data:
echo - data\fighters.json
echo - data\fights.json
echo - data\fighter_elo_ratings.csv
echo - data\fighter_history.json
echo.
set /p confirm=Are you sure? (y/n): 

if /i "%confirm%"=="y" (
    if exist "data\fighters.json" del "data\fighters.json"
    if exist "data\fights.json" del "data\fights.json"
    if exist "data\fighter_elo_ratings.csv" del "data\fighter_elo_ratings.csv"
    if exist "data\fighter_history.json" del "data\fighter_history.json"
    echo √ Data cleaned successfully.
) else (
    echo Data cleaning cancelled.
)
echo.
goto :eof

:check_and_run_visualizations
if exist "data\fighter_elo_ratings.csv" if exist "data\fighters.json" if exist "data\fights.json" (
    if exist "visualize_elo.py" (
        python visualize_elo.py
    ) else (
        echo visualize_elo.py not found. Please make sure the file exists.
    )
) else (
    echo X No data found. Please run the scraper first (option 1 or 2).
)
goto :eof