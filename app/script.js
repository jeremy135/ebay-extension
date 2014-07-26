(function(window, $, undefined){
    "use strict";
  var curUrl = "http://www.cbr.ru/scripts/XML_daily.asp",
    App = function(url) {
      this.curUrl = url;
      this.rate = '';
      this.priceSelectors = [
        'span[itemprop="price"]',
        'div[itemprop="price"]',
        '.nume_price',
        'p.g-asmR',
        'p.g-asmG',
        'h4.cost-label',
        'span.price'
      ].join(',');
    };

  App.fn = App.prototype;

  App.fn.init = function() {
    var today = new Date(),
      d = today.getDate(),
      m = today.getMonth()+ 1,
      y = today.getFullYear();
    this.currentDate = d + '-' + m + '-' + y;
    if (localStorage.getItem('date') !== this.currentDate) {
      this.ajax();
    } else {
      this.rateUS = localStorage.getItem('rate_usd');
      this.rateAU = localStorage.getItem('rate_aud');
      this.rateGBP = localStorage.getItem('rate_gbp');
      this.rateCAD = localStorage.getItem('rate_cad');
      this.insertPrice();
    }
    this.convertToLocalTime();
  };

  App.fn.ajax = function() {
    var xhr = new XMLHttpRequest(),
      self = this;
    xhr.open("GET", this.curUrl, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        self.setCurrentRate(xhr.responseText);
      }
    };
    xhr.send();
  };

  App.fn.setCurrentRate = function(xml) {
    if (!xml) {
      console.log('empty xml. Fail.');
      return;
    }
    var $xml = $(xml),
      usd = $xml.find('Valute[ID="R01235"] Value').html(),
      gbp = $xml.find('Valute[ID="R01035"] Value').html(),
      aud = $xml.find('Valute[ID="R01010"] Value').html(),
      cad = $xml.find('Valute[ID="R01350"] Value').html(),
      rateUS = usd.replace(',', '.'),
      rateGBP = gbp.replace(',', '.'),
      rateAU = aud.replace(',', '.'),
      rateCAD = cad.replace(',', '.');
    this.rateUS = rateUS;
    this.rateGBP = rateGBP;
    this.rateAU = rateAU;
    this.rateCAD = rateCAD;
    localStorage.setItem('rate_usd', this.rateUS);
    localStorage.setItem('rate_gbp', this.rateGBP);
    localStorage.setItem('rate_aud', this.rateAU);
    localStorage.setItem('rate_cad', this.rateCAD);
    localStorage.setItem('date', this.currentDate);
    this.insertPrice();
  };

  App.fn.insertPrice = function() {
    var self = this;
    $(this.priceSelectors).each(function() {
      var content = $(this).text(),
        price = parseFloat(content.replace(/[^0-9\.]+/g, "").replace(",","")),
        newPrice,
        withShippingCost = '',
        id = this.id,
        currency = "US";
      if (content.match(/US/)) {
        currency = "US";
      } else if (content.match(/GBP/)) {
        currency = "GBP";
      } else if (content.match(/AU/)) {
        currency = "AU";
      } else if (content.match(/C/)) {
        currency = "CAD";
      } else if (content.match(/£/)) {
        currency = "GBP";
      }
      newPrice = Math.round(price * self['rate' + currency]);

      if (id === 'prcIsum_bidPrice' || id === 'prcIsum') {
        var shippingCost = parseFloat($('#isum-shipCostDiv').text()
            .replace(/[^0-9\.]+/g, "").replace(",",""));
        withShippingCost = (Math.round(shippingCost * self['rate' + currency]) +
            newPrice);
        if (!isNaN(withShippingCost)) {
          withShippingCost = ' / ' + self.moneyFormat(withShippingCost);
        } else {
          withShippingCost = '';
        }
      }
      if (!isNaN(newPrice)) {
        $(this).after('<span class="b-app-rubles">(' +
            self.moneyFormat(newPrice) + withShippingCost + ' руб.)</div>');
      }
    });
  };

  App.fn.moneyFormat = function(num) {
    var strNum = '' + parseFloat(num).toFixed(2),
        parts = strNum.split('.'),
        head = parts[0] || '',
        tail = parts[1] || '',
        s = [];
    if (head) {
      var l = head.length,
          p = Math.floor(l / 3);
      for (var i = 0; i < p; i++) {
        s.push(head.substr(l - (i * 3) - 3, 3));
      }
      s.push(head.substr(0, (l % 3)));
      s.reverse();
    }
    if (s.length > 0) {
      return s.join(' ') + '.' + tail;
    } else {
      return num;
    }
  };

  App.fn.convertToLocalTime = function() {
    var timeNode = document.querySelectorAll('.endedDate, .time-ampm');
    if (timeNode && timeNode.length > 0) {
      var l = timeNode.length,
          //diff with local time
          dfTime = new Date().getUTCHours() - 7 - new Date().getHours(),
          timeZone = String(String(new Date()).split("(")[1]).split(")")[0],
          time, endHours, nextDay, endHoursLocal;
      while (l--) {
            time = timeNode[l].innerHTML;
        if (String(time).match(/PDT/)) {
          endHours = time.match(/^\d\d/);
          if (String(time).match(/PM/)) {
            endHours = endHours - 0 + 12
          }
          endHoursLocal = endHours - 0 - dfTime;
          nextDay = '';
          if (endHoursLocal > 24) {
            endHoursLocal -= 24;
            nextDay = '(+1 день)';
          }
          var timeStr = time.replace(/[A-Za-z()\s<>\.,]/g, "")
                  .replace(/^\d\d/, endHoursLocal);
          $(timeNode[l]).after('<span class="b-app-rubles">' + timeStr + ' ' +
              timeZone + nextDay +  '</span>');
        }
      }
    }
  };

  App.fn.updatePrice = function() {
    $('.b-app-rubles').remove();
    this.insertPrice();
  };

  App.fn.update = function() {
    var now = new Date().getTime(),
      self = this;
    if (this.lastUpdate + 2000 < now) {
      setTimeout(function () {
        self.updatePrice();
      }, 2500);
      this.lastUpdate = now;
    }
  };

  $(document).ready(function() {
    var myApp = new App(curUrl);
    myApp.init();

    setTimeout(function() {
      document.addEventListener("DOMSubtreeModified", function(e){
        myApp.update();
      });
    },10000);
  });

})(window, $);