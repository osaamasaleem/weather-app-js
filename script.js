/* ==========================================================================
   1. DOM ELEMENTS
   ========================================================================== */

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");

    const errorMessage = document.getElementById("errorMessage");
    const loadingIndicator =document.getElementById("loadingIndicator");

    const weatherCard = document.getElementById("weatherCard");
    const cityName = document.getElementById("cityName");
    const weatherDescription = document.getElementById("weatherDescription");

    const weatherIcon = document.getElementById("weatherIcon");
    const temperature = document.getElementById("temperature");
    const feelsLike = document.getElementById("feelsLike");
    const humidity = document.getElementById("humidity");
    const windSpeed = document.getElementById("windSpeed");

    const unitToggle = document.getElementById("unitToggle");

    const searchHistory = document.getElementById("searchHistory");
    const recentChips = document.getElementById("recentChips");
    const historyHeading = document.getElementById("historyHeading");
    const clearHistory = document.getElementById("clearHistory");

    const locateButton = document.getElementById("locateButton");

    const suggestionsList = document.getElementById("suggestionsList");

    const forecastContainer = document.getElementById("forecastContainer");

    const API_KEY = "e1e1c2d52fc04ab398e155423261809";
    const BASE_URL = "https://api.weatherapi.com/v1/forecast.json";

    const SEARCH_URL = "https://api.weatherapi.com/v1/search.json"
    


    let currentUnit = "C"; // tracks 'C' or 'F'
    let currentWeatherData = null; // stores the fetched JSON so toggling doesn't re-fetch
    let debounceTimer;



/* ==========================================================================
    FUNCTIONS
   ========================================================================== */
   
    async function fetchWeather(city, isBackground = false){
        try{
            // Only hide the card and show spinner if it's an active, manual search
            if (!isBackground) {
                loadingIndicator.classList.remove("hidden");
                weatherCard.classList.add("hidden");
            }
            errorMessage.classList.add("hidden");


            const url = `${BASE_URL}?key=${API_KEY}&q=${encodeURIComponent(city)}&days=3`;
            const response = await fetch(url);

            if(!response.ok){
                throw new Error("City not found. Please try again.");
            }

            const data = await response.json();
            currentWeatherData = data;
            renderWeather(data);
            saveData(data);
            if(!isBackground){
            addCityToHistory(data.location.name)
            renderRecentCities()
            console.log(data)
            }


        }
        catch(error){
            console.log(error)

            // Only display error UI if the user manually initiated the search
        if (!isBackground) {
            if (!navigator.onLine) {
            errorMessage.textContent = "No internet connection. Please check your network.";
        } else {
            errorMessage.textContent = error.message;
        }

        errorMessage.classList.remove("hidden");
        weatherCard.classList.add("hidden");
    }

        }finally{
            loadingIndicator.classList.add("hidden");
        }
    }

    async function fetchCitySuggestions(query){
        if(query.trim().length < 2){
            suggestionsList.classList.add("hidden");
            suggestionsList.innerHTML = ""
            return;
        }
        try{
            const url = `${SEARCH_URL}?key=${API_KEY}&q=${encodeURIComponent(query)}`;
            const response = await fetch(url)
            if(!response.ok){ return }

            const suggestions = await response.json();
            renderSuggestions(suggestions);

        }catch(error){
            console.error("Suggestions error:", error);

        }
            


    }

    function renderSuggestions(suggestions){
        suggestionsList.innerHTML = "";
        if(suggestions.length === 0){
            suggestionsList.classList.add("hidden");
            return;
        }

        suggestions.forEach(item=>{
            const li = document.createElement("li");
            li.textContent = `${item.name}, ${item.country}`;

            li.addEventListener("click", function(){
                searchInput.value = item.name;
                fetchWeather(`${item.name}, ${item.country}`);
                suggestionsList.classList.add("hidden");

            })

            suggestionsList.append(li);
        })
        suggestionsList.classList.remove("hidden");


    }

    function renderForecast(forecastDays){
        forecastContainer.innerHTML = "";
        forecastDays.forEach((item, index)=>{
            const dayCard = document.createElement("div")
            dayCard.className = "forecast-day";

            let dayLabel;
            if(index === 0){
                dayLabel = "Today";
            }else if(index === 1){
                dayLabel = "Tomorrow";
            }else{
                const dateObj = new Date(`${item.date}T00:00:00`);
                dayLabel = dateObj.toLocaleDateString("en-US", {weekday: "short"})
            }

            const maxTemp = currentUnit === "C"
            ? `${Math.round(item.day.maxtemp_c)}°`
            : `${Math.round(item.day.maxtemp_f)}°`;

            const minTemp = currentUnit === "C"
            ? `${Math.round(item.day.mintemp_c)}°`
            : `${Math.round(item.day.mintemp_f)}°`;

            dayCard.innerHTML = `
                <span class="forecast-date">${dayLabel}</span>
                <img src="https:${item.day.condition.icon}" alt="${item.day.condition.text}">
            <div class="forecast-temps">
                <span class="forecast-max">${maxTemp}</span>
                <span class="forecast-min">${minTemp}</span>
            </div>
        `;

        forecastContainer.append(dayCard);
        })
    }

    function renderWeather(data){
        weatherCard.classList.remove("hidden");
        errorMessage.classList.add("hidden");

        cityName.textContent = `${data.location.name}, ${data.location.country}`;
        weatherDescription.textContent = data.current.condition.text;

        temperature.textContent = currentUnit === "C"? `${Math.round(data.current.temp_c)}°C` : `${Math.round(data.current.temp_f)}°F`;        

        weatherIcon.src = `https:${data.current.condition.icon}`;
        weatherIcon.alt = data.current.condition.text;
        feelsLike.textContent = currentUnit === "C"? `${Math.round(data.current.feelslike_c)}°C` : `${Math.round(data.current.feelslike_f)}°F`;

    humidity.textContent = `${data.current.humidity}%`;
    windSpeed.textContent = `${data.current.wind_kph} km/h`;

    if (data.forecast && data.forecast.forecastday) {
    renderForecast(data.forecast.forecastday);
}



    }

    function saveData(data){
        localStorage.setItem("weatherCity", JSON.stringify(data));

    }

    function saveUnit(unit){
        localStorage.setItem("weatherUnit", unit)
    }

    function loadUnit(){
        return localStorage.getItem("weatherUnit")
    }

    function loadData(){
        const savedData = localStorage.getItem("weatherCity");

        if(savedData){
            return JSON.parse(savedData);
        }
        return null;
    }

    function saveRecentCities(cities){
        localStorage.setItem("weatherRecentCities", JSON.stringify(cities));
    }

    function loadRecentCities(){
        const saved = localStorage.getItem("weatherRecentCities");
        return saved? JSON.parse(saved) : [];
    }

    function addCityToHistory(city){
        //load the existing array of cities
        const cities = loadRecentCities();
        //now before entering new city into array, check if same one exists already
        const index = cities.findIndex(item => item.toLowerCase() === city.toLowerCase()) //take the index
        if(index!== -1){
            cities.splice(index, 1);
        }

        cities.unshift(city); // add the new city to the font

        if(cities.length >5){
            cities.pop();

        }
        saveRecentCities(cities);

    }

    function renderRecentCities(){
        recentChips.innerHTML = "";
        const cities = loadRecentCities();
        if(cities.length === 0){
            searchHistory.classList.add("hidden")
            return;
        }
        searchHistory.classList.remove("hidden");



        cities.forEach(city=>{
            const cityElement = document.createElement("button");
            cityElement.type = "button";
            cityElement.textContent = city;
            recentChips.append(cityElement)

            cityElement.addEventListener("click", function(){
                fetchWeather(city);
                searchInput.value = city;   
            })  
        })
    }

    function successCallback(position){
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const query = `${lat},${lon}`
        fetchWeather(query);
    }

    function errorCallback(error){
        loadingIndicator.classList.add("hidden")

        switch (error.code) {
        case error.PERMISSION_DENIED:
            errorMessage.textContent = "Location access denied. Please enable permissions.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage.textContent = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            errorMessage.textContent = "Location request timed out. Please try again.";
            break;
        default:
            errorMessage.textContent = "An unknown error occurred while getting location.";
            break;
        
    }
    errorMessage.classList.remove("hidden");
}

    



   

    

/* ==========================================================================
    EVENT LISTENERS
   ========================================================================== */
   
    searchForm.addEventListener("submit", function(e){
        e.preventDefault();
        clearTimeout(debounceTimer);
        suggestionsList.classList.add("hidden"); 
        const query = searchInput.value.trim();
        console.log("query:",{query});
        if(query === ""){
            errorMessage.classList.remove("hidden");
            errorMessage.textContent = "Enter a city name";
            return;
        }
         fetchWeather(query);
        


        

    })

    searchInput.addEventListener("input", function(){
        errorMessage.classList.add("hidden");

        clearTimeout(debounceTimer);

        const query = searchInput.value.trim();

        if (query.length < 2) {
            suggestionsList.innerHTML = "";
            suggestionsList.classList.add("hidden");
            return;
        }

        debounceTimer = setTimeout(() => {
        fetchCitySuggestions(query);
    }, 350);
        

    })

    unitToggle.addEventListener("click", function(){
        console.log(currentUnit)
        if(currentUnit === "C"){
            currentUnit = "F";
            unitToggle.textContent = "Switch to °C"
        }
        else{
            currentUnit = "C";
            unitToggle.textContent = "Switch to °F"
        }   

        saveUnit(currentUnit);

        if(currentWeatherData){

        renderWeather(currentWeatherData)
        if (currentWeatherData && currentWeatherData.forecast) {
            renderForecast(currentWeatherData.forecast.forecastday);
}
        }

    })

    clearHistory.addEventListener("click", function(){
        localStorage.removeItem("weatherRecentCities");
        renderRecentCities();
        
    })

    locateButton.addEventListener("click", function(){
        errorMessage.classList.add("hidden");

        if(!navigator.geolocation){
            errorMessage.textContent = "Your browser does not support geolocation.";
            errorMessage.classList.remove("hidden");
            return;
        }

        loadingIndicator.classList.remove("hidden");
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
    })


    document.addEventListener("click", function(event) {
    // If the click happened outside the input and outside the suggestions dropdown
    if (!searchInput.contains(event.target) && !suggestionsList.contains(event.target)) {
        suggestionsList.classList.add("hidden");
    }
    });

    // Restore unit preference first
const savedUnit = loadUnit();
if(savedUnit){
    currentUnit = savedUnit;
    unitToggle.textContent = currentUnit === "C" ? "Switch to °F" : "Switch to °C";
}

// Render search history chips on page load
renderRecentCities()

// Restore and render cached weather
const savedData = loadData()  
if(savedData){
    currentWeatherData = savedData;
    renderWeather(savedData)

    // Silently re-fetch to ensure the data on screen is live 
    fetchWeather(savedData.location.name, true)  
}

