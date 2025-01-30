let getSem = document.getElementById("getSem");
let even = document.querySelector(".evenSem");
even.style.display = "none";
let odd = document.querySelector(".oddSem");
odd.style.display = "block";
function handleClick() {

    getSem.addEventListener('click', () => {
        let value = document.getElementById("even-odd").value
        console.log(value)
        if (value === "odd") {
            even.style.display = "none";
            odd.style.display = "block";
        } else if (value === "even") {
            even.style.display = "block";
            odd.style.display = "none";
        }
    })
}

function setSelectedSemester(sem) {
    document.getElementById('selectedSemesterEven').value = sem;
    document.getElementById('selectedSemesterOdd').value = sem;
}

function handleChange(cTitle, cCode, max) {
    document.querySelector(".background").style.display = "block";
    document.querySelector(".popup").style.display = "block";
    document.getElementById("updateTitle").value = cTitle;
    document.getElementById("updateCode").value = cCode;
    document.getElementById("updatePrevCode").value = cCode;
    document.getElementById("updateLimit").value = max;

}

function handleCancel(){
    document.querySelector(".popup").style.display = "none";
    document.querySelector(".background").style.display = "none";
}
