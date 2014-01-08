(function(window, $, undefined){
	"use strict";
	var curUrl = "http://www.cbr.ru/scripts/XML_daily.asp",
		App = function(url) {
			this.curUrl = url;
			this.rate = '';
			this.priceSelectors = [
				'span[itemprop="price"]',
				'div[itemprop="price"]',
				'.nume_price'
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
			this.rate = localStorage.getItem('rate');
			this.insertPrice();
		}
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
		var usd = $(xml).find('Valute[ID="R01235"] Value').html(),
			rate = usd.replace(',', '.');
		this.rate = rate;
		localStorage.setItem('rate', this.rate);
		localStorage.setItem('date', this.currentDate);
		this.insertPrice();
	};

	App.fn.insertPrice = function() {
		var self = this;
		$(this.priceSelectors).each(function() {
			var price = parseFloat($(this).text().replace(/[^0-9\.]+/g, "").replace(",","")),
				newPrice = Math.round(price * self.rate),
				withShippingCost = '',
				id = this.id;

			if (id === 'prcIsum_bidPrice' || id === 'prcIsum') {
				var shippingCost = parseFloat($('#isum-shipCostDiv').text().replace(/[^0-9\.]+/g, "").replace(",",""));
					withShippingCost =  ' / ' + (Math.round(shippingCost * self.rate) + newPrice);
			}
			if (!isNaN(newPrice)) {
				this.innerHTML += '<span class="b-app-rubles">(' + newPrice + withShippingCost + ' руб.)</div>';
			}
		});
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