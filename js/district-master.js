/*
=========================================================
Government of Telangana - File Management System (FMS)
Master Data - Districts
Developed by: Lekha Technologies
Version: 1.0
=========================================================
*/

const DISTRICTS = [
    "Adilabad",
    "Bhadradri Kothagudem",
    "Hanamkonda",
    "Hyderabad",
    "Jagtial",
    "Jangaon",
    "Jayashankar Bhupalpally",
    "Jogulamba Gadwal",
    "Kamareddy",
    "Karimnagar",
    "Khammam",
    "Komaram Bheem Asifabad",
    "Mahabubabad",
    "Mahabubnagar",
    "Mancherial",
    "Medak",
    "Medchal–Malkajgiri",
    "Mulugu",
    "Nagarkurnool",
    "Nalgonda",
    "Narayanpet",
    "Nirmal",
    "Nizamabad",
    "Peddapalli",
    "Rajanna Sircilla",
    "Rangareddy",
    "Sangareddy",
    "Siddipet",
    "Suryapet",
    "Vikarabad",
    "Wanaparthy",
    "Warangal",
    "Yadadri Bhuvanagiri"
];

/**
 * Populate District Dropdown
 */
function loadDistricts() {

    const district = document.getElementById("district");

    if (!district) return;

    district.innerHTML =
        '<option value="">-- Select District --</option>';

    DISTRICTS.forEach(name => {

        const option = document.createElement("option");

        option.value = name;
        option.textContent = name;

        district.appendChild(option);

    });

}