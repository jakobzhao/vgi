window.onload = function collapse() {
  var coll = document.getElementsByClassName("collapsible");
  var i;
  console.log(document.getElementsByClassName("collapsible"))
  console.log(coll.length)
  for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
      this.classList.toggle("collapsed");
      var content = this.nextElementSibling;
      if (content.style.maxHeight){
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  }
}
