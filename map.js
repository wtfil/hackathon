var Map = (function () {
  var init = function () {
    var self = this;
    self._elements = [];
    $(function () {
      self._map = new Microsoft.Maps.Map(document.getElementById('SDKmap'), {
        credentials: 'AkAEe_tANwHMtwNNMIreEa-9lwXMleCnCHFAj5PkK6ShRVQvmjJh8ihqQE2mtZ0f'
      });
      navigator.geolocation.getCurrentPosition(function (position) {
        var coords = position.coords,
          lat = coords.latitude,
          lng = coords.longitude;
        self._map.setView({ zoom: 13, center: new Microsoft.Maps.Location(lat, lng) });
      });
    });
  };
  init.prototype = {
    _hideBalloons: function () {
      this._elements.forEach(function (e) {
        e.balloon.setOptions({ visible: false });
      })
    },
    placemark: function (coords, placemarkHTML, balloonHTML) {
      coords = coords || this._map.getCenter();
      balloonHTML = balloonHTML || '';
      var placemark = new Microsoft.Maps.Infobox(coords, {});
      var balloon = new Microsoft.Maps.Infobox(coords, {
        visible: false
      });
      placemark.setHtmlContent(placemarkHTML);
      balloon.setHtmlContent(balloonHTML);
      Microsoft.Maps.Events.addHandler(placemark, 'click', function(){
        balloon.setOptions({ visible: true });
        placemark.setOptions({ visible: false });
      });
      Microsoft.Maps.Events.addHandler(balloon, 'click', function () {
        balloon.setOptions({ visible: false });
        placemark.setOptions({ visible: true });
      });
      this._elements.push({
        balloon: balloon,
        placemark: placemark
      });
      this._map.entities.push(placemark);
      this._map.entities.push(balloon);
    }
  }
  return new init();
})();
