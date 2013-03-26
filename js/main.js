(function(window, undefined) {
    
function App() {

    var debug = false;

    var App = {};
    
    App.init = function() {
        loadDb();
    };

    var db
    ,   filterBrands = [], filterSaes = [], filterTags = []
    ,   filteredDb, filteredCounters
    ,   allBrandCounters, allSaeCounters, allPolyCounters, allTagCounters;

    loadDb = function() {
        $.ajax({
            dataType: "json"
        ,   url: "db.json"
        ,   success: function(data) {
                db = data;
                populateSelectors(data);
                postInit();
            }
        });
    };
    
    populateSelectors = function(data) {
        var i, brands = [], saes = [], tags = [];
        
        for (i in data) {
            brands.push(data[i].brand);
            saes.push(data[i].sae);
            tags = tags.concat(data[i].tags);
        }
        
        brands = unique(brands).sort();
        saes = unique(saes).sort(alphanum);
        tags = unique(tags).sort();
        
        populateDiv('brand', brands);
        populateDiv('sae',   saes);
        populateDiv('tag',   tags);
        
        attachHandlers();
    };
    
    postInit = function() {
        allBrandCounters = $('input.type-brand:checkbox ~ span.counter');
        allSaeCounters   = $('input.type-sae:checkbox ~ span.counter');
        allTagCounters   = $('input.type-tag:checkbox ~ span.counter');
        allPolyCounters  = $('input.type-poly:radio ~ span.counter');
        
        makeDbUsingFilters();
        App.updateCounters();
    };
    
    populateDiv = function(id, data) {
        var i, h = '';
        
//        h+= '<p>';
//        h+= '<label><input type="radio" name="logic-'+ id +'" checked="checked"> Включить</span><br/>';
//        h+= '<label><input type="radio" name="logic-'+ id +'"> Исключить</span>';
//        h+= '</p>';
        
        h+= '<p class="control">';
        h+= '<span class="link select-none type-'+ id +'" title="Снять все галочки">Очистить</span>';
        h+= '</p>';
        
        h+= '<ul>';
        
        if (id === 'tag') {
            h+= '<li>';
            h+= '<label>';
            h+= '<input type="checkbox" class="filter type-poly" value="">';
            h+= ' <span class="color-'+ id +'">';
            h+= 'полимеризация';
            h+= '</span>';
            h+= '</label>';
            h+= '</li>';
            
            h+= '<li class="color-'+ id +' poly-row">';
            h+= '<label class="disabled">';
            h+= '<input type="radio" name="poly" class="filter type-poly" value="1" disabled="disabled"> есть';
            h+= ' <span class="counter" value="poly-1"></span>';
            h+= '</label>';
            h+= '&nbsp;&nbsp;';
            h+= '<label class="disabled">';
            h+= '<input type="radio" name="poly" class="filter type-poly" value="0"  disabled="disabled" checked="checked"> нет';
            h+= ' <span class="counter" value="poly-0"></span>';
            h+= '</label>';
            h+= '</li>';
        }
        
        for (i in data) {
            h+= '<li>';
            h+= '<label>';
            h+= '<input type="checkbox" class="filter type-'+ id +'" value="'+ data[i] +'">';
            h+= ' <span class="color-'+ id +'">';
            switch (id) {
                case 'sae':
                    h+= data[i].replace('w', 'w-');
                    break;
                    
                default:
                    h+= data[i];
            }
            h+= '</span>';
            h+= ' <span class="counter" value="'+ data[i] +'"></span>';
            h+= '</label>';
            h+= '</li>';
        }
        h+= '</ul>';
        
        $('#'+ id).html(h);
    };
    
    attachHandlers = function() {
        $('input.filter').bind('change', function() {
            updateFilters($(this));
        });
        
        $('span.select-none').bind('click', function() {
            uncheckGroup($(this));
        });
    };
    
    updateFilters = function(selector) {
        if (debug) {
            var timer = (new Date()).getTime();
        }
        
        var isCheckbox = selector.is('input') // can be 'select-none' trigger
        ,   isChecked  = selector.is(':checked')
        ,   filter; // will hold reference to normal array
        
        if (       selector.hasClass('type-brand')) {
            filter = filterBrands;
        } else if (selector.hasClass('type-sae')) {
            filter = filterSaes;
        } else if (selector.hasClass('type-tag')) {
            filter = filterTags;
        } else if (selector.hasClass('type-poly')) {
//            $('input[name=poly]:radio').prop('disabled', !$('input.type-poly:checkbox').prop('checked'));
            
            if ($('input.type-poly:checkbox').prop('checked')) {
                $('input[name=poly]:radio').prop('disabled', false);
                allPolyCounters.parent().removeClass('disabled');
            } else {
                $('input[name=poly]:radio').prop('disabled', true);
                allPolyCounters.parent().addClass('disabled');
            }
            
            filter = [];
        }

        if (isCheckbox) {
            if (isChecked) {
                filter.push(selector.val());
            } else if (filter.indexOf(selector.val()) !== -1) {
                remove(filter, filter.indexOf(selector.val()));
            }
        } else {
            // http://stackoverflow.com/a/1232046
            filter.length = 0;
        }

        if (debug) {
            console.log(filterBrands);
            console.log(filterSaes);
            console.log(filterTags);
        }

        makeDbUsingFilters();
        App.rebuildResults();
        App.updateCounters();
        
        if (debug) {
            console.log(((new Date()).getTime() - timer) +' ms');
        }
    };
    
    App.rebuildResults = function() {
        
        // nothing selected
        var isNothing = (!filterBrands.length && !filterSaes.length && !filterTags.length && !$('input.type-poly:checkbox').prop('checked')) ? true : false;
        
        if (isNothing) {
            $('#results').html('');
        }
        
        if (isNothing) {
            return;
        }
        
        var i, h = '';
        
        for (i in filteredDb) {
            h+= makeResultItem(filteredDb[i]);
        }
        
        $('#results').html(h);
    };
    
    App.updateCounters = function() {
        var i;
        
        allBrandCounters.html('');
        for (i in filteredCounters['brand']) {
            allBrandCounters.filter('[value="'+ i +'"]').html(filteredCounters['brand'][i].counter);
        }
        
        allSaeCounters.html('');
        for (i in filteredCounters['sae']) {
            allSaeCounters.filter('[value="'+ i +'"]').html(filteredCounters['sae'][i].counter);
        }
        
        allPolyCounters.filter('[value=poly-1]').html(filteredCounters['poly'][1] || '');
        allPolyCounters.filter('[value=poly-0]').html(filteredCounters['poly'][0] || '');
        
        allTagCounters.html('');
        for (i in filteredCounters['tag']) {
            allTagCounters.filter('[value="'+ i +'"]').html(filteredCounters['tag'][i].counter);
        }
    };
    
    makeDbUsingFilters = function() {
        var i, j, fDb = [], common;
        
        filteredCounters = {
            'brand': {}
        ,   'sae': {}
        ,   'tag': {}
        ,   'poly': {0: 0, 1: 0}
        }
        
        var usePoly = $('input.type-poly:checkbox').prop('checked')
        ,   polyValue = parseInt($('input[name=poly]:radio:checked').val());
        
        for (i in db) {
            
            // quick filter, so will be first
            if (usePoly && db[i].poly !== polyValue) {
                continue;
            }
            
            if (filterBrands.length && filterBrands.indexOf(db[i].brand) < 0) {
                continue;
            }
            
            if (filterSaes.length && filterSaes.indexOf(db[i].sae) < 0) {
                continue;
            }
            
            if (filterTags.length) {
                common = intersect(filterTags, db[i].tags);
                if (common.length !== filterTags.length) {
                    continue;
                }
            }
            
            fDb.push(db[i]);
            
            filteredCounters['brand'][db[i].brand] ? filteredCounters['brand'][db[i].brand].counter++ : filteredCounters['brand'][db[i].brand] = {counter: 1};
            filteredCounters['sae'][db[i].sae]     ? filteredCounters['sae'][db[i].sae].counter++     : filteredCounters['sae'][db[i].sae] = {counter: 1};
            for (j in db[i].tags) {
                filteredCounters['tag'][db[i].tags[j]] ? filteredCounters['tag'][db[i].tags[j]].counter++ : filteredCounters['tag'][db[i].tags[j]] = {counter: 1};
            }
            filteredCounters['poly'][db[i].poly]++;
        }
        
        $('#notes').html('&nbsp;Нашлось: '+ fDb.length);
        
        filteredDb = fDb;
    };
    
    makeResultItem = function(item) {
        var h = '';
        
        h+= '<div class="result-item">';
        h+= '<h3><span class="color-brand">'+ item.brand +'</span> '+ item.product +' <span class="color-sae">'+ item.sae.replace('w', 'W-') +'</span></h3>';
        h+= '<p>'+ item.text +'</p>';
        h+= '<img src="'+ item.img +'" />';
        h+= '</div>';
        
        return h;
    };
    
    uncheckGroup = function(trigger) {
        trigger.parents('div.group').find('input.filter:checked').prop('checked', false);
        
        if (trigger.parents('div.group').attr('id') == 'tag') {
            $('input:radio[name=poly][value=0]').prop('checked', true);
            $('input[name=poly]:radio').prop('disabled', true);
            allPolyCounters.parent().addClass('disabled');
        }
        
        updateFilters(trigger);
    };
    
    
    
    
    
    unique = function(a) {
        return $.grep(a, function(el, index) {
            return index === $.inArray(el, a);
        });
    };
    
    intersect = function(arr1, arr2) {
        var temp = [];
        for(var i = 0; i < arr1.length; i++){
            for(var k = 0; k < arr2.length; k++){
                if(arr1[i] == arr2[k]){
                    temp.push(arr1[i]);
                    break;
                }
            }
        }
        return temp;
    };
    
    // Array Remove - By John Resig (MIT Licensed)
    remove = function(array, from, to) {
        var rest = array.slice((to || from) + 1 || array.length);
        array.length = from < 0 ? array.length + from : from;
        return array.push.apply(array, rest);
    };
    
    // http://stackoverflow.com/a/14599441
    naturalSort = function(a, b) {
        return +/\d+/.exec(a)[0] > +/\d+/.exec(b)[0];
    };
    
    // http://my.opera.com/GreyWyvern/blog/show.dml/1671288
    function alphanum(a, b) {
        function chunkify(t) {
            var tz = [], x = 0, y = -1, n = 0, i, j;

            while (i = (j = t.charAt(x++)).charCodeAt(0)) {
                var m = (i == 46 || (i >=48 && i <= 57));
                if (m !== n) {
                    tz[++y] = "";
                    n = m;
                }
                tz[y] += j;
            }
            return tz;
        }

        var aa = chunkify(a);
        var bb = chunkify(b);

        for (x = 0; aa[x] && bb[x]; x++) {
            if (aa[x] !== bb[x]) {
                var c = Number(aa[x]), d = Number(bb[x]);
                if (c == aa[x] && d == bb[x]) {
                    return c - d;
                } else return (aa[x] > bb[x]) ? 1 : -1;
            }
        }
        return aa.length - bb.length;
    }

    return App;
};

window.App = App();
    
}(window));

$(document).ready(function() {
    App.init();
});