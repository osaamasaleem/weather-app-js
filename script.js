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

    const API_KEY = "e1e1c2d52fc04ab398e155423261809";
    const BASE_URL = "https://api.weatherapi.com/v1/current.json";

    let currentUnit = "C"; // tracks 'C' or 'F'
    let currentWeatherData = null; // stores the fetched JSON so toggling doesn't re-fetch

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


            const url = `${BASE_URL}?key=${API_KEY}&q=${encodeURIComponent(city)}`;
            const response = await fetch(url);

            if(!response.ok){
                throw new Error("City not found. Please try again.");
            }

            const data = await response.json();
            currentWeatherData = data;
            renderWeather(data);
            saveData(data);
            
            console.log(data)


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

    

/* ==========================================================================
    EVENT LISTENERS
   ========================================================================== */
   
    searchForm.addEventListener("submit", function(e){
        e.preventDefault();
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
        }

    })

const savedUnit = loadUnit();
if(savedUnit){
    currentUnit = savedUnit;
    unitToggle.textContent = currentUnit === "C" ? "Switch to °F" : "Switch to °C";
}


const savedData = loadData()  
if(savedData){
    currentWeatherData = savedData;
    renderWeather(savedData)

    // Silently re-fetch to ensure the data on screen is live 
    fetchWeather(savedData.location.name, true)  
}

