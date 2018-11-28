/* 60 min
Secure_base_url
image sizes

colocar no local storage (em que momento verificar?)
imagem nao encontrada
stale timeout acertar para 1 hora
*/

/* Clean up
    console.log
*/

/* global APIKEY */

let myTDMBSearch = (function () {

    const movieDataBaseURL = "https://api.themoviedb.org/3/";
    let imageURL = null;
    let imageSizes = [];
    let mode = "movie";
    let pageActive = "schInitial"; //(schInitial, schResult, schRecom)

    let imageURLKey = "imageURLKey";
    let imageSizesKey = "imageSizesKey";
    let modeKey = "movieKey";
    let timeKey = "timeKey";

    let staleDataTimeOut = 30; // 30 seconds, good for testing

    let searchString = "";

    document.addEventListener("DOMContentLoaded", init);

    localStorage.setItem(modeKey, JSON.stringify(mode));

    function init() {

        if (pageActive == "schInitial") {
            createInitialSearchPage();
        }

        addEventListeners();

        getDataFromLocalStorage();
    }

    function addEventListeners() {

        // Get the input field
        let searchInput = document.getElementById("search-input");

        // Execute a function when the user releases a key on the keyboard
        searchInput.addEventListener("keyup", function (event) {
            // Cancel the default action, if needed
            event.preventDefault();
            // Number 13 is the "Enter" key on the keyboard
            if (event.keyCode === 13) {
                // Trigger the button element with a click
                document.querySelector(".searchButtonDiv").click();
            }
        });

        let searchButton = document.querySelector(".searchButtonDiv");
        searchButton.addEventListener("click", startSearch);

        let backhButton = document.querySelector(".backButtonDiv");
        backhButton.addEventListener("click", goBackPage);

        let modeButton = document.querySelector(".ModeButtonDiv");
        modeButton.addEventListener("click", showOverlay);

        document.querySelector(".cancelButton").addEventListener("click", hideOverlay);
        document.querySelector(".overlay").addEventListener("click", hideOverlay);

        document.querySelector(".saveButton").addEventListener("click", function (e) {
            let ModeList = document.getElementsByName("mode");
            let modeType = null;
            for (let i = 0; i < ModeList.length; i++) {
                if (ModeList[i].checked) {
                    modeType = ModeList[i].value;
                    break;
                }
            }
            localStorage.setItem(modeKey, JSON.stringify(modeType));

            //change the title in the initial search page
            if (pageActive == "schInitial") {
                let initialTitle = document.querySelector("header>h3");

                if (modeType == "movie") {
                    initialTitle.textContent = "Movie Recommendations";
                } else {
                    initialTitle.textContent = "Television Recommendations";
                }
            } else if (pageActive == "schResult" || pageActive == "schRecom") {

                //refresh the result page for the new mode
                document.querySelector(".searchButtonDiv").click();

            }
            hideOverlay(e);

        });

    }

    function getDataFromLocalStorage() {
        // Check if image secure base url and sizes array are saved in Local Storage, if not call getPosterURLAndSizes()

        imageURLKey = localStorage.getItem(imageURLKey);
        console.log(imageURLKey);
        imageSizesKey = localStorage.getItem(imageSizesKey);
        console.log(imageSizesKey);

        if (imageURLKey == null || imageSizesKey == null) {

            console.log("LocalStorage nao tem imageKeys");
            getPosterURLAndSizes();

        } else {
            // if in local storage check if saved over 60 minutes ago, if true call getPosterURLAndSizes()

            // First see if the key exists in local storage
            if (localStorage.getItem(timeKey)) {
                console.log("Retrieving Saved Date from Local Storage");
                let savedDate = localStorage.getItem(timeKey); // get the saved date sting
                savedDate = new Date(savedDate); // use this string to initialize a new Date object
                console.log(savedDate);

                let seconds = calculateElapsedTime(savedDate);
                console.log("saveDate= ", seconds, " staleDataTimeOut= ", staleDataTimeOut);
                if (seconds > staleDataTimeOut) {
                    console.log("Local Storage Data is stale ", seconds);

                    getPosterURLAndSizes();
                } else {
                    // in local storage AND < 60 minutes old, load and use from local storage
                    let imageURL = localStorage.getItem(imageURLKey);
                    let imageSizes = localStorage.getItem(imageSizesKey);
                }
            } else {
                saveDateToLocalStorage();
            }
        }

    }


    function getPosterURLAndSizes() {
        //https://api.themoviedb.org/3/configuration?api_key=<<api_key>>
        //template string
        let url = `${movieDataBaseURL}configuration?api_key=${APIKEY}`;

        fetch(url)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {

                imageURL = data.images.secure_base_url;
                imageSizes = data.images.poster_sizes;

                localStorage.setItem(imageURLKey, JSON.stringify(imageURL));
                localStorage.setItem(imageSizesKey, JSON.stringify(imageSizes));

                saveDateToLocalStorage();
            })
            .catch(function (error) {
                console.log(error);
            })
        // fetch
    }

    function saveDateToLocalStorage() {

        let now = new Date();
        localStorage.setItem(timeKey, now);
    }

    function calculateElapsedTime(savedDate) {
        let now = new Date(); // get the current time
        console.log(now);

        // calculate elapsed time
        let elapsedTime = now.getTime() - savedDate.getTime(); // this in milliseconds

        let seconds = Math.ceil(elapsedTime / 1000);
        console.log("Elapsed Time: " + seconds + " seconds");
        return seconds;
    }

    function startSearch() {

        searchString = document.getElementById("search-input").value;
        if (!searchString) {
            alert("Please enter search data");
            document.getElementById("search-input").focus();

            return;
        }

        // this is a new search so you should reset any existing page data
        let pages = document.querySelectorAll(".page");

        pages.forEach(function (item) {
            item.classList.add("hide");
        });
        getSearchResults();
    }

    function getSearchResults() {

        mode = JSON.parse(localStorage.getItem(modeKey));

        let url = `${movieDataBaseURL}search/${mode}?api_key=${APIKEY}&query=${searchString}`;

        fetch(url)
            .then((response) => response.json())
            .then(function (data) {
                //get and show 

                if (data.total_results > 0) {
                    createPages(data);
                } else {
                    alert("0 results");
                    return;
                }
            })
            .catch((error) => alert(error));

    }

    function createPages(data) {

        let title = document.querySelector("#search-results>.title");

        let content = document.querySelector("#search-results>.content");

        let msg = document.createElement("h3");
        title.innerHTML = "";
        content.innerHTML = "";

        if (data.total_results == 0) {
            msg.innerHTML = `No results found for ${`searchString`}`;
        } else {
            msg.innerHTML = `Results from 1-20 from a total of ${data.total_results} for  "${searchString}".<br> Click on a title to get recommendations.`
        }

        title.appendChild(msg);

        let documentFragment = new DocumentFragment();

        documentFragment.appendChild(createMovieCard(data.results));

        content.appendChild(documentFragment);

        let searchPage = document.getElementById("search-results");
        searchPage.classList.remove("hide");
        searchPage.classList.add("active");

        if (pageActive == "schInitial") {
            createSmallSearchPage();
        }

        let cardList = document.querySelectorAll(".content>div");

        cardList.forEach(function (item) {
            item.addEventListener("click", getRecommendations);
        });
    }

    function createMovieCard(results) {

        mode = JSON.parse(localStorage.getItem(modeKey));

        let documentFragment = new DocumentFragment(); // use a documentFragment for performance

        results.forEach(function (movie) {

            let movieCard = document.createElement("div");
            let section = document.createElement("section");
            let image = document.createElement("img");
            let videoTitle = document.createElement("p");
            let videoDate = document.createElement("p");
            let videoRating = document.createElement("p");
            let videoOverview = document.createElement("p");

            // set up the content
            if (mode == "movie") {
                videoTitle.textContent = movie.title;
                videoDate.textContent = movie.release_date;
            } else {
                videoTitle.textContent = movie.name;
                videoDate.textContent = movie.first_air_date;
            }

            videoRating.textContent = movie.vote_average;

            // check if overview has more than 650 characters
            if ((movie.overview).length > 650) {

                //if yes, truncate the overview
                movie.overview = (movie.overview).substr(0, 650);

                // check if the last word will be "truncate"
                if ((movie.overview).lastIndexOf(" ") != 650) {
                    // assign the overview until the last whole word
                    movie.overview = (movie.overview).substring(0, movie.overview.lastIndexOf(" "));
                } else {
                    movie.overview = (movie.overview).substr(0, 649);
                }

                movie.overview = movie.overview + "...";
            }

            videoOverview.textContent = movie.overview;

            // set up image source URL
            if (movie.poster_path != null) {
                //            image.src = `https://image.tmdb.org/t/p/w185${movie.poster_path}`;
                image.src = `${imageURL}${imageSizes[2]}${movie.poster_path}`;
                image.alt = `${movie.title}`
            } else {
                //mostrar quadrado imagem nao disponivel
                image.src = 'img/no-img-available.jpg';
                image.alt = "No image available";
                //image.alt = `${movie.title} - Image not available`;
            }

            // set up movie data attributes
            if (mode == "movie") {
                movieCard.setAttribute("data-title", movie.title);
            } else {
                movieCard.setAttribute("data-title", movie.name);
            }
            movieCard.setAttribute("data-id", movie.id);

            // set up class names
            movieCard.className = "movieCard";

            /*movieCard.classList.add("animate");*/
            //console.log("movieCard effect: ", movieCard);

            section.className = "imageSection";

            // append elements
            section.appendChild(image);
            movieCard.appendChild(section);
            movieCard.appendChild(videoTitle);
            movieCard.appendChild(videoDate);
            movieCard.appendChild(videoRating);
            movieCard.appendChild(videoOverview);

            documentFragment.appendChild(movieCard);
        });
        return documentFragment;
    }

    function getRecommendations() {

        mode = JSON.parse(localStorage.getItem(modeKey));

        let movieTitle = this.getAttribute("data-title");

        let movieId = this.getAttribute("data-id");

        searchString = movieTitle;

        let url = `${movieDataBaseURL}${mode}/${movieId}/recommendations?api_key=${APIKEY}&language=en-US&page=1`;

        fetch(url)
            .then((response) => response.json())
            .then(function (data) {
                //get and show 
                
                if (data.total_results > 0) {
                    showMovieRecommendations(data);
                } else {
                    alert("0 results");
                    return;
                }
            })
            .catch((error) => alert(error));
    }

    function showMovieRecommendations(data) {

        let title = document.querySelector("#recommend-results>.title");

        let content = document.querySelector("#recommend-results>.content");

        let msg = document.createElement("h3");
        title.innerHTML = "";
        content.innerHTML = "";

        if (data.total_results == 0) {
            msg.innerHTML = `No recommendations found for ${`searchString`}`;
        } else {
            msg.innerHTML = `Recommendations from 1-20 from a total of ${data.total_results} for  "${searchString}".<br> Click on a title to get recommendations.`
        }

        title.appendChild(msg);

        let documentFragment = new DocumentFragment();

        documentFragment.appendChild(createMovieCard(data.results));

        content.appendChild(documentFragment);

        let searchPage = document.getElementById("search-results");
        searchPage.classList.remove("active");
        searchPage.classList.add("hide");

        let recommendhPage = document.getElementById("recommend-results");
        recommendhPage.classList.remove("hide");
        recommendhPage.classList.add("active");

        pageActive = "schRecom"

        let cardList = document.querySelectorAll(".content>div");

        cardList.forEach(function (item) {
            item.addEventListener("click", getRecommendations);
        });

    }

    function showOverlay(e) {
        e.preventDefault();
        let overlay = document.querySelector(".overlay");
        overlay.classList.remove("hide");
        overlay.classList.add("show");
        showModal(e);
    }

    function showModal(e) {
        e.preventDefault();

        mode = JSON.parse(localStorage.getItem(modeKey));

        if (mode == "movie") {
            document.getElementById("movie").checked = true;
        } else {
            document.getElementById("tv").checked = true;
        }

        let modal = document.querySelector(".modal");
        modal.classList.remove("off");
        modal.classList.add("on");
    }

    function hideOverlay(e) {
        e.preventDefault();
        e.stopPropagation(); // don't allow clicks to pass through
        let overlay = document.querySelector(".overlay");
        overlay.classList.remove("show");
        overlay.classList.add("hide");
        hideModal(e);
        document.getElementById("search-input").focus();

    }

    function hideModal(e) {
        e.preventDefault();
        let modal = document.querySelector(".modal");
        modal.classList.remove("on");
        modal.classList.add("off");
    }

    function createInitialSearchPage() {

        let header = document.querySelector("header");
        let searchControls = document.querySelector(".searchControls");

        let msg = document.createElement("h3");

        mode = JSON.parse(localStorage.getItem(modeKey));

        if (mode == "movie") {
            msg.innerHTML = "Movie Recommendations";
        } else {
            msg.innerHTML = "Television Recommendations";
        }

        header.insertBefore(msg, searchControls);
                
        if (pageActive == "schInitial") {
            let attrib = document.querySelector(".attribution");
            let linkTmdb = document.createElement("a");

            linkTmdb.setAttribute("href", "https://www.themoviedb.org/");

            let logoTmdb = document.createElement("img");
            logoTmdb.setAttribute("src", "img/tmdb_logo2.png")
            logoTmdb.setAttribute("alt", "The Movie DB");
            logoTmdb.setAttribute("width", "234"); //468/161
            logoTmdb.setAttribute("height", "80");

            linkTmdb.appendChild(logoTmdb);

            attrib.appendChild(linkTmdb);
        }
        
        let backButton = document.querySelector(".backButtonDiv");
        if (backButton.classList.contains("active")) {
            backButton.classList.remove("active");
        }
        backButton.classList.add("hide");

        // this is a new search so you should reset any existing page data
        let pages = document.querySelectorAll(".page");

        pages.forEach(function (item) {
            if (item.classList.contains("active")) {
                item.classList.remove("active");
            }
            item.classList.add("hide");
        });

        if (header.classList.contains("small")) {
            header.classList.remove("small");
        }
        header.classList.add("initial");

        document.getElementById("search-input").value = "";
        document.getElementById("search-input").focus();

        pageActive = "schInitial";

    }

    function createSmallSearchPage() {

        let header = document.querySelector("header");
        let headerTitle = document.querySelector("h3");

        let backButton = document.querySelector(".backButtonDiv");

        header.removeChild(headerTitle);

        if (backButton.classList.contains("hide")) {
            backButton.classList.remove("hide");
        }
        backButton.classList.add("show");

        if (header.classList.contains("initial")) {
            header.classList.remove("initial");
        }
        header.classList.add("small");

        pageActive = "schResult"

    }

    function goBackPage() {

        if (pageActive == "schResult") {
            createInitialSearchPage();

        } else if (pageActive == "schRecom") {

            let searchPage = document.getElementById("search-results");
            searchPage.classList.remove("hide");
            searchPage.classList.add("active");

            let recommendhPage = document.getElementById("recommend-results");
            recommendhPage.classList.remove("active");
            recommendhPage.classList.add("hide");

            pageActive = "schResult"
        }
    }
})();
