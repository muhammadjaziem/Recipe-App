const mealsEl = document.getElementById("meals");
const favoriteContainer = document.getElementById("fav-meals");
const mealPopup = document.getElementById("meal-popup");
const mealInfoEl = document.getElementById("meal-info");
const popupCloseBtn = document.getElementById("close-popup");

const searchTerm = document.getElementById("search-term");
const searchBtn = document.getElementById("search");
let totalCalories = [];
let removeTotalCalories =[];
let sumCalories=0;
let removeSumCalories =0;
var search;
var ingredients = [];
var storeEverything =[];

fetchFavMeals();

async function getMealById(id) {
    const resp = await fetch(
        "https://www.themealdb.com/api/json/v1/1/lookup.php?i=" + id
    );

    const respData = await resp.json();
    const meal = respData.meals[0];

    return meal; //only one meal is returned here
}

async function getMealsBySearch(term) {
   //console.log(term);
    const resp = await fetch(
        "https://api.edamam.com/api/nutrition-data?app_id=e8ff11c2&app_key=acb60e8aa07dce6ec2ece6c94275f3ce%20%09&nutrition-type=cooking&ingr=" + term
    );

    const respData = await resp.json();
    totalCalories.push(respData.calories); //taking the calories data
    let dietLabels = respData.dietLabels; // diet labels data
    sumCalories=0;
    for (let i = 0; i < totalCalories.length; i++) {
        sumCalories += totalCalories[i];
    }
    if(dietLabels.length>2)
    {
        dietLabels = "Diet Labels" + " " + dietLabels[0] + "," + dietLabels[1];
        sumCalories = "Total Calories" + " " + sumCalories;
        return [sumCalories, dietLabels]; 
    }

    dietLabels = "Diet Labels" + " " + dietLabels;
    sumCalories = "Total Calories" + " " + sumCalories;
    return [sumCalories, dietLabels]; 
}

async function removeCaloriesUnselected (termMeals)
{
    removeSumCalories =0;
    const respUnselected = await fetch(
        "https://api.edamam.com/api/nutrition-data?app_id=e8ff11c2&app_key=acb60e8aa07dce6ec2ece6c94275f3ce%20%09&nutrition-type=cooking&ingr=" + termMeals
    );

    const respDataUnselected = await respUnselected.json();
    //totalCalories.push(respDataUnselected.calories); //taking the calories data
    //console.log(respDataUnselected.calories);

    for (let p = 0; p < totalCalories.length; p++) {
        removeSumCalories += totalCalories[p];
    }
     
    

    var sum = totalCalories.reduce(function(a, b){
        return a + b;
    }, 0);

    sum = sum - respDataUnselected.calories;
    totalCalories = [];
    totalCalories.push(sum);
     //console.log(totalCalories.length);
    //removeSumCalories - respDataUnselected.calories;
    //console.log(removeSumCalories - respDataUnselected.calories);
}

function nutritionFacts(mealData, random = false) {
    //putting information into a table
    console.log(mealData);

    const meal = document.createElement("div");
    meal.classList.add("meal"); //add CSS elements

    //add HTML elements
    meal.innerHTML = `
        <div class="meal-body">
            <h4>${mealData}</h4>
            <button class="fav-btn">
               
            </button>
        </div>
    `;

    const btn = meal.querySelector(".meal-body .fav-btn");

    btn.addEventListener("click", () => {
        if (btn.classList.contains("active")) {
            removeMealLS(mealData.idMeal);
            btn.classList.remove("active");
        } else {
            addMealLS(mealData.idMeal);
            btn.classList.add("active");
        }
        fetchFavMeals();
    });

    meal.addEventListener("click", () => {
        showMealInfo(mealData);
    });

    mealsEl.appendChild(meal);
}

function addMealLS(mealId) {
    const mealIds = getMealsLS();

    localStorage.setItem("mealIds", JSON.stringify([...mealIds, search]));
}

function removeMealLS(mealId) {
    const mealIds = getMealsLS();
    //alert(mealIds);
    localStorage.setItem(
        "mealIds",
        JSON.stringify(mealIds.filter(mealId))
    );

    //some work need to be done on the removal
}

function getMealsLS() {
    const mealIds = JSON.parse(localStorage.getItem("mealIds"));

    return mealIds === null ? [] : mealIds;
}

async function fetchFavMeals() {
    // clean the container
    favoriteContainer.innerHTML = "";

    const mealIds = getMealsLS();
    //alert(mealIds);
    for (let i = 0; i < mealIds.length; i++) {
        const mealId = mealIds[i];
        meal = await getMealById(mealId);

        addMealFav(meal);
    }
}

function addMealFav(mealData) {
    const favMeal = document.createElement("li");
   
    favMeal.innerHTML = `
        <img
            src="${mealData.strMealThumb}"
            alt="${mealData.strMeal}"
        /><span>${mealData.strMeal}</span>
        <button class="clear"><i class="fas fa-window-close"></i></button>
    `;

    const btn = favMeal.querySelector(".clear");

    btn.addEventListener("click", () => {
        removeMealLS(mealData.idMeal);
        
        fetchFavMeals();
    });

    favMeal.addEventListener("click", () => {
        showMealInfo(mealData);
    });

    favoriteContainer.appendChild(favMeal);
}

function showMealInfo(mealData) {
    // clean it up
    mealInfoEl.innerHTML = "";
    //alert(mealData);
    // update the Meal info
    const mealEl = document.createElement("div");

    // get ingredients and measures
    
    var iterator = ingredients.values();
    for (let elements of iterator) {
        
        var node = document.createElement("LI");
        node.innerHTML = elements;
        var removeButton = document.createElement("BUTTON");
        removeButton.innerHTML = "CANCEL";
        
       
        node.appendChild(removeButton);

        removeButton.onclick = function () {
           
            
            this.parentNode.remove();
            //console.log(this.parentElement.firstChild);
           var holdString =  this.parentElement.firstChild.textContent;
           //console.log(holdString.substring(1));
           const id = ingredients.indexOf(holdString);
           
           //console.log(id);
           ingredients.splice(id,  1);
            removeCaloriesUnselected(holdString);
        };
       
        mealEl.appendChild(node);

    }

    mealInfoEl.appendChild(mealEl);

    // show the popup
    mealPopup.classList.remove("hidden");
}

searchBtn.addEventListener("click", async () => {
    // clean container
    mealsEl.innerHTML = "";

     search = searchTerm.value;
     ingredients.push(search);
   // console.log(search);
    const meals = await getMealsBySearch(search);

    if (meals) {
        meals.forEach((meal) => {
            nutritionFacts(meal);
        });
    }
});

popupCloseBtn.addEventListener("click", () => {
    mealPopup.classList.add("hidden");
});
