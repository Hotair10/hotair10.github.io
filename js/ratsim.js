var ratLogJSON = {};

$(document).ready(function() {

	$('#optionsCheckbox').attr('checked',false).change(function(event) {
		$('tr#optionsRow').toggle();
		event.preventDefault();
	});
	$('#calcFoodCostCheckbox').attr('checked',false).change(function(event) {
		$('span.calcFoodCost').toggle();
		$('li.cashSpentUpgrades').toggle();
		$('li.cashSpentFood').toggle();
		event.preventDefault();
	});

	$('#ratSelect').empty();

	$.each(rats, function(key, val) {
		$('#ratSelect').append('<option value="' + key + '">' + key + '</option>');
		var ability = [], location = val['Location'].join('<br>');
		for (var x = 0; x < val['Ability'].length; x++) {
			ability[x] = '<span class="abilityType">' + val['Ability'][x]['Type'] + '</span><span class="abilityDesc">' +
			val['Ability'][x]['Description'] + '</span>';
		}
		ability = ability.join('<br>');
		var stats = '<td  class="sort_num">' + val['Stats'].join('</td><td>') + '</td>';
		$('#ratDetailTable tbody').append('<tr class="ratDetailRow"><td><b>' + key + '</b></td><td>' + ability + '</td><td>' + location + 
				'</td>' + stats + '</tr>');
	});
	$('a#ratDetailLink').click(function(event) {
		if (!$('#ratDetailTable').is(':visible')) {
			$(this).text('Hide Detailed Rat List');
			$('#ratDetailTable').show();
		}
		else {
			$(this).text('Show Detailed Rat List');
			$('#ratDetailTable').hide();
		}
	});
	$('#ratDetailTable thead tr th').click(function(event) {
		var cell = this.cellIndex;
		var dir = ($(this).hasClass('sort_asc') ? 'desc' : 'asc');
		var numeric = ($(this).hasClass('sort_num') ? true : false);
		$(this).removeClass('sort_asc sort_desc').addClass('sort_' + dir);
		var $table = $('#ratDetailTable tbody');
		$table.find('tr').sort(function(cellA, cellB){ 
			var textA = $(cellA).find('td:eq(' + cell + ')').text(), 
			textB = $(cellB).find('td:eq(' + cell + ')').text(); 
			if (numeric == true) { textA = parseInt(textA); textB = parseInt(textB); }
			return ((dir == 'desc') ? (textA < textB ? 1 : (textA > textB ? -1 : 0)) : 
				(textA > textB ? 1 : (textA < textB ? -1 : 0)));         
		}).appendTo($table);
		event.preventDefault();
	});

	$('#ratAdd').click(function(event) { 
		//clone master rows, populate with selected rats info
		var ratName = $('#ratSelect').val(), ratStats = rats[ratName]['Stats'], ratImg = rats[ratName]['Image'], 
		ratID = (new Date().getTime()).toString() + (Math.floor((Math.random() * 100) + 1).toString());

		ratLogJSON[ratID] = [];

		$('#ratTable tr#ratStatRow_master').clone().attr('id','ratStatRow_' + ratID).appendTo('#ratTable tbody').show();
		$('#ratTable tr#ratRow_master').clone().attr('id','ratRow_' + ratID).appendTo('#ratTable tbody').show();
		$('#ratTable tr#ratLog_master').clone().attr('id','ratLogRow_' + ratID).appendTo('#ratTable tbody').hide();

		var $statRow = $('#ratTable').find('#ratStatRow_' + ratID), $ratRow = $('#ratTable').find('#ratRow_' + ratID);
		$statRow.find('.ratName').text(ratName);
		$statRow.find('.ratLife').text(ratStats[0]);
		$statRow.find('.ratSpd').text(ratStats[1]);
		$statRow.find('.ratAtk').text(ratStats[2]);
		$statRow.find('.ratDef').text(ratStats[3]);

		ratLogJSON[ratID][0] = (parseInt(ratStats[1]) + parseInt(ratStats[2]) + parseInt(ratStats[3]));

		var ability = [];
		for (var x = 0; x < rats[ratName]['Ability'].length; x++) {
			ability[x] = rats[ratName]['Ability'][x]['Description'];
		}

		$ratRow.find('.ratAbility').html('<li>' + ability.join('</li><li>') + '</li>');
		$ratRow.find('.ratImg div').html('<img width="120" height="80" border="0" title="' + ratName + '" src="img/' + ratImg + '"></img>'); 
		$ratRow.find('.foodList, .foodVegList, .upgradeList').hide();
		updateUpgradeList($ratRow);
		updateFoodList($ratRow, true);

		event.preventDefault();
	});

	$('#ratTable').on('click','a',function(event) {
		var $row = $(this).closest('tr');
		if ($(this).hasClass('showStatGraph')) {
			makeGraph($row.prev('.statRow').attr('id').toString().replace('ratStatRow_',''));
			return false;
		}
		$row.find('.ratLog, .foodList, .foodVegList, .upgradeList, .ratAbility').hide();
		if ($(this).hasClass('showRatLogLink')) {
			$row.next('.ratLogRow').toggle();
			$('.ratAbility').show();
		}
		else if ($(this).closest('ul').is('.foodList, .foodVegList, .foodFeedAll')) {
			var meals = parseInt($row.prev('.statRow').find('.ratMeals').text()), mealCost, foodText;

			mealCost = (($(this).closest('span').hasClass('foodFeedAll')) ? meals : 1);
			foodText = (mealCost > 1 ? $(this).closest('li').find('a').first().text() : $(this).text());

			feedRat($row,$(this).attr('class').replace('foodFeedAllLink','').replace(' ',''),foodText,mealCost);
		}
		else if ($(this).hasClass('feedLink')) {
			if ($row.find('.ratImg img[src*="vegetarian.png"]').length > 0) {
				$row.find('.foodVegList').show();
			}
			else { 
				$row.find('.foodList').show();
			}
		}
		else if ($(this).hasClass('upgradeLink')) {
			updateUpgradeList($row);
			$row.find('.upgradeList').show();
		}
		else if ($(this).hasClass('upgradeVegLink')) {
			var autoFeed = false, $food = null;

			$row.find('.ratImg').append('<img class="upgImg" src="img/vegetarian.png"></img>');
			$row.find('.upgradeList li.upgradeVeg').wrap('<span style="text-decoration:line-through;"></span>');
			$(this).replaceWith('[Cost 4 cheese');
			if ($row.find('.foodCheckbox input[type="checkbox"]:checked').length > 0) {
				$food = $row.find('.foodCheckbox input[type="checkbox"]:checked').closest('li').find('a').first().attr('class');
				autoFeed = true;
			}
			$row.find('.foodList').remove();
			$row.prev('.statRow').find('.ratCheese').text(parseInt($row.prev('.statRow').find('.ratCheese').text()) - 4);
			updateUpgradeList($row);
			addLog($row, 'Vegetarian upgrade purchased');
			$row.find('.upgradeList').show();
			if (autoFeed == true) { 
				$row.find('.foodVegList a.' + $food).closest('li').find('.foodCheckbox').show();
				$row.find('.foodVegList a.' + $food).closest('li').find('.foodCheckbox input[type="checkbox"]').attr('checked',true);
			}
		}
		else if ($(this).hasClass('upgradeBuddhismLink')) {
			$row.find('.ratImg').append('<img class="upgImg" src="img/buddhist.png"></img>');
			$row.find('.upgradeList li.upgradeBuddhism').wrap('<span style="text-decoration: line-through;"></span>');
			$(this).replaceWith('[Cost 4 cheese');
			$row.prev('.statRow').find('.ratCheese').text(parseInt($row.prev('.statRow').find('.ratCheese').text()) - 4);
			updateUpgradeList($row);
			addLog($row, 'Buddhism upgrade purchased');
			$row.find('.upgradeList').first().show();
		}
		else if ($(this).is('.upgradeAtkLink,.upgradeLifeLink,.upgradeDefLink,.upgradeSpdLink,.upgradeMealsLink,.upgradeLifeLink')) {
			var cheeseCost = parseInt($(this).find('.cheeseCost').text()), cashCost = parseInt($(this).find('.cashCost').text()), 
			upgradeCount = parseInt($(this).prev('.upgradeCount').text()), 
			cheese = parseInt($row.prev('.statRow').find('.ratCheese').text()),
			ratStats = rats[$row.prev('.statRow').find('td.ratName').text()]['Stats'],
			foodCost = parseInt($row.find('li.cashSpentFood .cashSpentFood').text()), 
			upgradeCost = parseInt($row.find('li.cashSpentUpgrades .cashSpentUpgrades').text());

			$row.find('li.cashSpentUpgrades .cashSpentUpgrades').text(upgradeCost  + cashCost);
			$row.find('li.cashSpentTotal .cashSpent').text(upgradeCost + foodCost + cashCost);

			$(this).find('.cashCost').first().text(cashCost + 5000);
			$(this).prev('.upgradeCount').text(upgradeCount + 1);
			upgradeCount++;
			$row.prev('.statRow').find('.ratCheese').text(cheese - cheeseCost);

			if ($(this).hasClass('upgradeAtkLink')) {
				$row.prev('.statRow').find('.ratAtk').text(parseInt($row.prev('.statRow').find('.ratAtk').text()) + 20);
				addLog($row, 'Upgraded attack for ' + cheeseCost + ' cheese');
			}
			else if ($(this).hasClass('upgradeSpdLink')) { 
				$row.prev('.statRow').find('.ratSpd').text(parseInt($row.prev('.statRow').find('.ratSpd').text()) + 20);
				addLog($row, 'Upgraded speed for ' + cheeseCost + ' cheese');
			}
			else if ($(this).hasClass('upgradeDefLink')) {
				$row.prev('.statRow').find('.ratDef').text(parseInt($row.prev('.statRow').find('.ratDef').text()) + 20);
				addLog($row, 'Upgraded defense for '+ cheeseCost + ' cheese');
			}
			else if ($(this).hasClass('upgradeMealsLink')) {
				$row.prev('.statRow').find('.ratMeals').text(parseInt($row.prev('.statRow').find('.ratMeals').text()) + 3);
				addLog($row, 'Upgraded meals for ' + cheeseCost + ' cheese');
				updateFoodList($row);
			}
			else if ($(this).hasClass('upgradeLifeLink')) {
				$row.prev('.statRow').find('.ratLife').text(parseInt($row.prev('.statRow').find('.ratLife').text()) + ratStats[0]);
				addLog($row, 'Upgraded life (+' + ratStats[0].toString() + ') for ' + cheeseCost + ' cheese');
			}
			if ((upgradeCount > 0) && (upgradeCount % 5 == 0)) {
				cheeseCost++;
			}
			$(this).find('.cheeseCost').text(cheeseCost);
			updateUpgradeList($row);
			$row.find('.upgradeList').show();
		}
		else if ($(this).hasClass('fastForwardLink')) {
			advanceTime($row);
		}
		else if ($(this).hasClass('abandonLink')) {
			if (confirm("You sure you wanna murder this rat?!") == true) {
				$row.prev('tr').remove();
				$row.next('tr').remove();
				$row.remove();
			}	
		}

		event.preventDefault();
	});

	function feedRat($row, mealClass, foodText, times) {

		var isVeg = ($row.find('.ratImg img[src*="vegetarian.png"]').length > 0 ? true : false), 
		meals = parseInt($row.prev('.statRow').find('.ratMeals').text()), 
		expHas = parseInt($row.prev('.statRow').find('.ratExpHas').text()), newExp = 0,
		expLevel = parseInt($row.prev('.statRow').find('.ratExpLevel').text()), addLife = 0, addExp = 0, 
		foodRange = parseInt((mealClass == 'furlong' ? 9 : mealClass.toString().replace('food',''))), 
		ratStats = rats[$row.prev('.statRow').find('.ratName').text()]['Stats'], 
		calcFoodCost = $('#calcFoodCostCheckbox').is(':checked'), level = parseInt($('#calcFoodCostLevel').val()),
		foodCost = 0, foodCostKnown = false, foodType = null;
		level = (level > 0 ? level : 100);

		if (calcFoodCost == true) {	
			if ((isVeg == false) && (foodRange == 1)) {
				foodType = 'Raw Chicken Leg';
				foodCost = ((level + 3) / 2);
				foodCostKnown = true;
			}
			else if (foodRange == 2) {
				//wonka vs. apples (both veg)
				foodCost = 100;
				foodType = 'Wonka Bar';
				if ((2 * (level + 3 ) / 2) < 100) {
					foodCost = (2 * (level + 3 ) / 2);
					foodType = 'Fresh Apple';
				}
				foodCostKnown = true;
			}
			else if (foodRange == 3) {
				//Wonka-stripe Candy Cane vs. choc ice cream (both veg)
				foodCost = 500;
				foodType = 'Wonka-stripe Candy Cane';
				if ( (5 * (level + 3) / 2) < 500) {
					foodCost = (5 * (level + 3) / 2);
					foodType = 'Chocolate Ice Cream';
				}
				foodCostKnown = true;
			}
			else if (foodRange == 4) {
				foodType = 'Red Hots';
				foodCost = 3000;
				foodCostKnown = true;
			}
			else if (foodRange == 5) {
				foodType = 'Fighters Lunch';
				foodCost = ((10 * (level + 3) / 2) * 2);
				foodCostKnown = true;
			}
			else if (foodRange == 9) {
				foodCost = 10000;
				foodType = 'Fruit by the Furlong';
				foodCostKnown = true;
			}
			if (foodCostKnown = true) {
				foodText = foodType;
				$row.find('li.cashSpentFood .cashSpentFood').text(parseInt($row.find('li.cashSpentFood .cashSpentFood').text()) +
						(foodCost * times));
				$row.find('li.cashSpentTotal .cashSpent').text(
						parseInt($row.find('li.cashSpentUpgrades .cashSpentUpgrades').text()) +
						parseInt($row.find('li.cashSpentFood .cashSpentFood').text()));
			}
		}

		if (foodRange < 7) {
			addExp = foodRange * 2;
			addLife = (10 - foodRange);
		}
		else if (mealClass == 'food7') {
			addExp = 16;
			addLife = 2;
		}
		else if (mealClass == 'food8') {
			addExp = 20;
			addLife = 0;
		}
		else if (foodRange == 9) {
			addExp = 18;
			addLife = -8;
		}

		addLife = (((isVeg == true ? (addLife+1) : addLife) + 1) * times);
		addExp = (((isVeg == true ? (addExp+1) : addExp) + 1) * times);
		newExp = (expHas + addExp);

		addLog($row, 'Fed ' + times + ' meals (' + foodText + ') to rat, gaining ' + addExp + ' exp, ' + addLife + ' life');

		if (newExp < expLevel) {
			$row.prev('.statRow').find('.ratExpHas').text(expHas + addExp);
		}
		else {
			while (newExp >= expLevel) {
				$row.prev('.statRow').find('.ratExpLevel').text(expLevel + 3);
				$row.prev('.statRow').find('.ratLevel').text(parseInt($row.prev('.statRow').find('.ratLevel').text()) + 1);
				$row.prev('.statRow').find('.ratCheese').text(parseInt($row.prev('.statRow').find('.ratCheese').text()) + 1);
				$row.prev('.statRow').find('.ratExpHas').text(newExp - expLevel);
				$row.prev('.statRow').find('.ratSpd').text(parseInt($row.prev('.statRow').find('.ratSpd').text()) + ratStats[1]);
				$row.prev('.statRow').find('.ratAtk').text(parseInt($row.prev('.statRow').find('.ratAtk').text()) + ratStats[2]);
				$row.prev('.statRow').find('.ratDef').text(parseInt($row.prev('.statRow').find('.ratDef').text()) + ratStats[3]);
				newExp = (newExp - expLevel);
				expLevel = expLevel + 3;
				addLog($row, 'Rat is now level ' + $row.prev('.statRow').find('.ratLevel').text() + '!');
			}
		}
		$row.prev('.statRow').find('.ratLife').text(parseInt($row.prev('.statRow').find('.ratLife').text()) + addLife);
		$row.prev('.statRow').find('.ratMeals').text(meals - times);
		updateFoodList($row);

		if (isVeg == true) {
			$row.find('.foodVegList').show();
		}
		else if (isVeg == false) {
			$row.find('.foodList').show();
		}
	}

	function updateUpgradeList($row) {
		$row.find('.upgradeList li').each(function(x) {
			if (parseInt($(this).find('b.cheeseCost').text()) > parseInt($row.prev('.statRow').find('.ratCheese').text())) {
				$(this).find('.upgradeDisabled').remove();
				$(this).find('a').hide();
				$(this).append('<span class="upgradeDisabled">' +
						$(this).find('a').text() + '</span>');
			}
			else if ($(this).find('.upgradeDisabled').length > 0) {
				$(this).find('.upgradeDisabled').remove();
				$(this).find('a').show();
			}
		});
	}

	function updateFoodList($row, init) {
		var meals = parseInt($row.prev('.statRow').find('.ratMeals').text());
		if (init == true) {
			$row.find('.foodCheckbox input[type="checkbox"]').change(function(event) {
				if ($(this).is(':checked')) {
					$row.find('.foodCheckbox').hide();
					$(this).closest('.foodCheckbox').show();
				}
				else if (!$(this).is(':checked')) {
					$row.find('.foodCheckbox').show();
				}
				event.preventDefault();
			});
		}
		$row.find('.foodList,.foodVegList').find('li .foodFeedAll').empty();
		if (meals > 0) {
			$row.find('.foodList,.foodVegList').find('li .foodDisabled').remove();
			$row.find('.foodList,.foodVegList').find('li').each(function(x) {
				var foodClass = $(this).find('a').attr('class');
				if (meals > 1) {
					$(this).find('.foodFeedAll').html('<a href="#" class="foodFeedAllLink ' + foodClass + '">Feed x' + meals + '</a>');
				}
			});
			if (init != true) {
				$row.find('.foodList,.foodVegList').find('a').show();
			}
		} 
		else {
			$row.find('.foodList,.foodVegList').find('li').each(function(x) {
				$(this).find('.foodDisabled').remove();
				$(this).find('a').hide();
				$(this).prepend('<span class="foodDisabled">' + $(this).find('a').text() + '</span>');
			});
		}
	}

	function addLog($row, text) {
		$row.next('.ratLogRow').first().find('.ratLogArea').append('Age ' + $row.prev('.statRow').find('.ratAge').text() +
				' - ' + text + "\n");
	}

	function advanceTime($row) {
		var $statRow = $row.prev('.statRow');
		var ratID = $statRow.attr('id').toString().replace('ratStatRow_','');

		var age = parseInt($row.prev('.statRow').find('.ratAge').text()) + 1;
		var life = (parseInt($row.prev('.statRow').find('.ratLife').text()) - ((age - 1) * 2));
		var addMeals = 8, mealMax = 10, ratName = $statRow.find('.ratName').text(), addText = '';
		var spd = parseInt($statRow.find('.ratSpd').text()), atk = parseInt($statRow.find('.ratAtk').text()), 
		def = parseInt($statRow.find('.ratDef').text());

		ratLogJSON[ratID][age-1] = (spd + def + atk);

		$row.find('.foodList, .foodVegList, .upgradeList,.ratAbility').hide();

		if (ratName == 'Two Headed Rat') {
			addMeals = 12;
			mealMax = 20;
		}
		var meals = parseInt($row.prev('.statRow').find('.ratMeals').text()) + addMeals;
		if (($('#enforceMealLimit').is(':checked')) && (meals > mealMax)) {
			meals = mealMax;
		}
		$row.prev('.statRow').find('.ratAge').text(age);
		$row.prev('.statRow').find('.ratLife').text(life);
		if (life < 0) {

			$row.find('.ratOpts a.fastForwardLink, .ratOpts a.feedLink').closest('li').remove();
			$row.find('.upgradeList li').each(function(x) {
				$(this).find('.upgradeDisabled').remove();
				$(this).find('a').hide();
				$(this).append('<span class="upgradeDisabled">' +
						$(this).find('a').text() + '</span>');
			});

			$row.find('.ratLog').html('Dead. :(<br><br>Final Stats: ' + spd + '/' + atk + '/' + def +
					' (' + (spd + atk + def) + ' total)' + '<br><br>' +
					'Upgrades purchased: <br><br><ul>' + $row.find('.upgradeList li').closest('ul').html() + '</ul>').show(); 

			addLog($row, 'Rat died :(');
			addLog($row, 'Final Stats: ' + spd + '/' + atk + '/' + def + ' (' + (spd + atk + def) + ' total)');

			$row.find('.ratOpts').remove();
			return;
		}
		$row.prev('.statRow').find('.ratMeals').text(meals);
		updateFoodList($row);
		updateUpgradeList($row);
		if ($row.find('.foodCheckbox input[type="checkbox"]:checked').length > 0) {
			var $food = $row.find('.foodCheckbox input[type="checkbox"]:checked').closest('li').find('a').first();
			feedRat($row, $food.attr('class'), $food.text(), meals);
			$row.find('.foodList, .foodVegList, .upgradeList,.ratAbility').hide();
			addText += "Auto feeding rat.. <br>";
		}
		$row.find('.ratLog').first().html(addText + 'Magic 24 hour time travel complete!').show();
	}
	
	function makeGraph(ratID) {
		var ctx = $("#chart").get(0).getContext("2d");
		var labels = [], vals = [];
		var counter = 0;
		while (ratLogJSON[ratID].hasOwnProperty(counter) == true) {
			if (counter%2==0) {
			labels.push(counter+1);
			vals.push(ratLogJSON[ratID][counter]);
			}
			counter++;
		}
		var newChart = new Chart(ctx);
		var data = {
				labels : labels,
				datasets : [
					{
						fillColor : "rgba(220,220,220,0.5)",
						strokeColor : "rgba(220,220,220,1)",
						pointColor : "rgba(220,220,220,1)",
						pointStrokeColor : "#fff",
						data : vals
					}
				]
		};

		new Chart(ctx).Line(data);
		$('#chart').css('display','block').show();
		$('.hideGraphLink').show();
	}
	
	$('.hideGraphLink').click(function(event) {
		$('#chart').css('display','none').hide();
		$(this).hide();
		event.preventDefault();
	});
	
});