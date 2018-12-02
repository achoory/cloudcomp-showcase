var apiKey='AIzaSyDPcjLwNaGB_PRNjdhotnT7H95cgZKtwyw';
$(function() {
  $('#result').hide();
  $('#inputLoader').hide();
  var options1 = $("#towns");
  $.getJSON("javascripts/town.json", function(result) {
      options1.append($("<option />").val("").text(""));
      $.each(result.towns, function() {
        options1.append($("<option />").val(this.Name).text(this.Name));
     });
   });

   var options2 = $("#flat_type");
   $.getJSON("javascripts/flat_type.json", function(result) {
       options2.append($("<option />").val("").text(""));
       $.each(result.flat_types, function() {
         options2.append($("<option />").val(this.TypeName).text(this.TypeName));
      });
    });
});


function formSubmit(){
  $("#price").html("");
  $("#price_sqm").html("");
  $("#chartImg").html("<br><br><br><br><br><br><br><br><br><br><br><br>");
  $("#add").html("");
  $("#stName").html("");
  $("#stCode").html("");
  $("#stDistance").html("");
  $("#opening").html("");
  $("#mapImg").html("");
  $("#schTable").html("");

    var town=$("#towns").val();
    var flatType=$("#flat_type").val();
    var size=$("#size").val();
    var postal=$("#postal").val();
    var distMrt=0;

    if((town=='')||(flatType=='')||(size=='')||postal==('')){
      alert("Please fillup all fields!");
    }else{
      var queryurl='../apis/getFlatInfo?postal='+postal;
      try{
        $('#result').show();
        $('#addLoader').show();
        $('#priceLoader').show();
        $('#mrtLoader').show();
        $('#schLoader').show();
$('#inputLoader').show();
        $.get(queryurl,function(data){
            console.log(data);
            if (data=='500'){

              $('#addLoader').hide();
              $('#priceLoader').hide();
              $('#mrtLoader').hide();
              $('#schLoader').hide();
              $('#result').hide();
              $('#inputLoader').hide();
              alert("Invalid Postal Code!");
            }else{
              var jdata=JSON.parse(data);
              $("#add").html(jdata.address);
              $("#stName").html(jdata.nearestMrt);
              $("#stCode").html(jdata.nearestMrtCode);
              distMrt=Math.round(jdata.distanceToMrt);
              $("#stDistance").html(Math.round(jdata.distanceToMrt));
              var dateStr=jdata.openingDate.toString().substring(0, 10)
              $("#opening").html(dateStr);
              var mapImg="https://maps.googleapis.com/maps/api/staticmap?size=480x536&center="
              +jdata.coordinates.lat+","+jdata.coordinates.lon+"&zoom=15&maptype=roadmap&markers=color:red%7Clabel:%7C"+
              jdata.coordinates.lat+","+jdata.coordinates.lon;
              console.log(mapImg);
              $("#mapImg").html('<img src="'+mapImg+'" alt="map" width="100%" >');
var sch='';
              for(var i=0; i<jdata.nearbySchools.length; i++){
                var schName=jdata.nearbySchools[i].school_name;
                if (jdata.nearbySchools[i].top_pri==1){
                  schName='<span style="color:red">'+jdata.nearbySchools[i].school_name+'</span>'
                }
                sch=sch+'<tr><td>'+schName+'</td><td>'+jdata.nearbySchools[i].dis+'</td></tr>';
              }
              $("#schTable").html(sch);

              $('#addLoader').hide();

              $('#mrtLoader').hide();
              $('#schLoader').hide();

              var pricequery='../apis/getPrice?town='+town+'&falttype='+flatType+'&size='+size+'&distToMrt='+distMrt;
              $.get(pricequery,function(rdata){
                var rdataobj=JSON.parse(rdata);
                $("#price").html(rdataobj.price);
                $("#price_sqm").html(rdataobj.price_sqm);
                $("#chartImg").html('<img src="'+rdataobj.chart_path+'" alt="chart" width="100%">');
                  $('#priceLoader').hide();
                  $('#inputLoader').hide();
              });
            }
        });
      }catch(err){
        $('#addLoader').hide();
        $('#priceLoader').hide();
        $('#mrtLoader').hide();
        $('#schLoader').hide();
        $('#inputLoader').hide();
        $('#result').hide();
        console.log(err);
      }
    }

}
