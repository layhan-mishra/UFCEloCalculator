import streamlit as st
import pandas as pd
import json

# Set page config
st.set_page_config(page_title="UFC Elo Tracker", page_icon="🥊")

st.title("🥊 UFC Fighter Elo Rankings")
st.markdown("""
This dashboard displays real-time Elo ratings for UFC fighters calculated from historical fight data.
""")

# Load data
@st.cache_data
def load_data():
    df = pd.read_csv('data/fighter_elo_ratings.csv')
    # Round Elo for cleaner display
    df['elo'] = df['elo'].round(2)
    return df

try:
    df = load_data()

    # Sidebar Search
    st.sidebar.header("Search & Filter")
    search_query = st.sidebar.text_input("Search Fighter Name")

    if search_query:
        display_df = df[df['name'].str.contains(search_query, case=False)]
    else:
        display_df = df

    # Stats Summary
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Fighters", len(df))
    col2.metric("Highest Elo", df['elo'].max())
    col3.metric("Avg Elo", round(df['elo'].mean(), 2))

    # Display Table
    st.dataframe(display_df, use_container_width=True, hide_index=True)

except FileNotFoundError:
    st.error("Data file not found. Please run the scraper or check the data folder.")