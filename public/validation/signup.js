const password = document.getElementById("password");
const confirm_password = document.getElementById("confirm-password");
const username = document.getElementById("username");

function validateAll(){
  if(username.value.length < 2 && username.value.length > 30){
    username.setCustomValidity("Name must be between 2 and 30 characters");
  }
  else{
    username.setCustomValidity("");
  }

  if(password.value != confirm_password.value) {
    confirm_password.setCustomValidity("Passwords Don't Match");
  } else {
    confirm_password.setCustomValidity('');
  }

  if(password.value.length < 6 || password.value.length > 30) {
    password.setCustomValidity("Password must be between 6 and 30 characters");
  } else {
    password.setCustomValidity('');
  }
}

password.onchange = validateAll;
confirm_password.onkeyup = validateAll;