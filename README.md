### Linking D3 Charts and Adding Interactivity ([link](https://stuteeroutray.github.io/linking-charts-in-d3/))

This assignment was done as part of CSE 578 - Data Visualization coursework at Arizona State University.

Basic components of this project:
* Choropleth map of Africa.
* Line chart drawn on clicking any region on the map.
* Tooltips over each region of the map as well as over the line chart.
* Data and color scheme updated via html elements. (does not show on github page ([link](https://stuteeroutray.github.io/linking-charts-in-d3/)), works on local server)
* Stylized axes on line chart.

#### Data Description

The data comes from the World Bank ([link](https://databank.worldbank.org/source/africa-development-indicators)). It shows, from 1960-2011, the GDP per capita of countries in Africa (based on current USD). 

* `data/Data_Extract_From_Africa_Development_Indicators.xlsx` is the excel file generated and downloaded from The World Bank website using their DataBank interface.
* `data/africa_gdp_per_capita.csv` is the formatted csv file where some countries have missing data for some years (stored as empty strings).
* `data/africa.geojson` is the geojson file used to create the map (ie, the country shapes).
