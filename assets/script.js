function getList(dataset, callback) {
    $.get("https://spreadsheets.google.com/feeds/list/" + dataset + "/1/public/values?alt=json").then(function(data) { callback(data); });
}

$(function() {
    var lastTouchEnd = 0;
    document.documentElement.addEventListener('touchend', function(event) {
        var now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    document.documentElement.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, false);

    getList('1ZBvqBmEYO8D8f3CxoVZMVjBbbOGqLfDQuAkDJxneTsg', function(data) {
        var d = data.feed.entry;
        var settings = {};
        for (var i in d) {
            settings[d[i].gsx$key.$t] = d[i].gsx$value.$t;
            if (d[i].gsx$key.$t == "pickUpDay") {
                settings[d[i].gsx$key.$t] = d[i].gsx$value.$t.split(', ');
            }
        }
        var title = document.querySelector('title');
        title.innerHTML = settings['pageTitle'];
        var titleText = document.querySelector('h1');
        titleText.innerHTML = settings['pageTitle'] + '<span id="fulfilled"><br>你已消費&nbsp;$0</span>';
        titleText.innerHTML += '<span id="timer">｜載入中……</span>';
        var timer = setInterval(function() {
            var now = moment().valueOf();
            var timerText = document.querySelector('.timer');
            timerText.innerHTML = ''
            var y = parseInt(settings['openYear']);
            var m = parseInt(settings['openMonth']);
            var d = parseInt(settings['openDay']);
            var openTime = moment([y, m - 1, d]);
            var y = parseInt(settings['closeYear']);
            var m = parseInt(settings['closeMonth']);
            var d = parseInt(settings['closeDay']);
            var closeTime = moment([y, m - 1, d + 1]);
            var openDiff = diff(openTime);
            var closeDiff = diff(closeTime);
            if (openDiff['diff'] <= 0 && closeDiff['diff'] > 0) {
                timesUp(openTime, closeTime);
            } else {
                diffText(timerText, openDiff, closeDiff);
            }
        }, '1000');

        function timesUp(openTime, closeTime) {
            main(openTime, closeTime);
            clearInterval(timer);
        }
        function diff(t) {
            var timeStart = moment().valueOf();
            var timeEnd = t.valueOf();
            var diff = moment.duration(timeEnd - timeStart);
            var d = Math.abs(diff.days());
            var h = Math.abs(diff.hours());
            var m = Math.abs(diff.minutes());
            var s = Math.abs(diff.seconds());
            var diffText = ' '
            if ((d) != 0) {
                diffText += d;
                diffText += ' 天 ';
            }
            if ((d + h) != 0) {
                diffText += h;
                diffText += ' 小時 ';
            }
            if ((d + h + m) != 0) {
                diffText += m;
                diffText += ' 分 ';
            }
            if ((d + h + m + s) != 0) {
                diffText += s;
                diffText += ' 秒';
            }
            return {
                'diff': diff,
                'text': diffText
            };
        }
        function diffText(item, openDiff, closeDiff) {
            if (openDiff['diff'] > 0) {
                item.innerHTML = settings['BeforeMessage'].replace('%{text}', openDiff['text']);
            } else if (closeDiff['diff'] < 0) {
                item.innerHTML = settings['AfterMessage'].replace('%{text}', closeDiff['text']);
            } else {
                item.innerHTML = (item.id == 'timer' ? ' ｜' : '') + settings['DuringMessage'].replace('%{text}', closeDiff['text']);
            }
        }
        function updateTimer(item, openTime, closeTime) {
            setInterval(function() {
                var openDiff = diff(openTime);
                var closeDiff = diff(closeTime);
                diffText(item, openDiff, closeDiff);
            }, '1000');
        }

        function notice() {
            /*
            var wrapper = document.querySelector('.wrapper')
            var noticeBox = document.createElement('div');
                noticeBox.className = 'noticeBox';
                noticeBox.innerHTML = '請先詳閱以下訂購須知';
            var noticeText = document.createElement('div');
                noticeText.className = 'noticeText';
                noticeText.innerHTML = settings['noticeText'];
            var closeBtn = document.createElement('button');
                closeBtn.className = 'closeBtn';
                closeBtn.innerHTML = '我已閱讀並確認';
                noticeBox.appendChild(closeBtn);
                noticeBox.appendChild(noticeText);
                wrapper.appendChild(noticeBox);
            $('.closeBtn').on('click', function() {
                wrapper.classList.add('hide');
                $('.closeBtn').off('click');
            })
            */
            document.querySelector('.wrapper').classList.add('hide');
        }

        var isMember = false;
        var isCoupon = false;
        var members = [];
        var coupon = {};
        var availableCode = [];
        var studentIDValue;
        var couponValue;

        function main(openTime, closeTime) {
            var intro = document.querySelector('#intro');
            intro.innerHTML = settings['intro'];
            document.querySelector('.timer').classList.add('hide');
            notice();
            getDepartmentsList(settings['departmentsList']);
            addPickUpDay();
            getProductsList(settings['productsList']);
            function getProductsList(dataset) {
                //create product list and items set
                getList(dataset, function(data) {
                    var d = data.feed.entry;
                    var items = {};
                    for (var i in d) {
                        var merchant = d[i].gsx$merchant.$t;
                        var info = d[i].gsx$info.$t;
                        items[merchant] = {};
                        items[merchant]['info'] = info;
                    }
                    for (var i in d) {
                        var merchant = d[i].gsx$merchant.$t;
                        var product = d[i].gsx$product.$t.replace(/ /g,'_');
                        items[merchant][product] = {
                            'price': d[i].gsx$price.$t,
                            'priceMember': d[i].gsx$pricemember.$t,
                            'd1': d[i].gsx$d1.$t,
                            'd2': d[i].gsx$d2.$t,
                            'upperLimit': d[i].gsx$upperlimit.$t,
                            'link': d[i].gsx$link.$t,
                            'pic': d[i].gsx$pic.$t,
                        };
                    }
                    addProducts(items);
                    addProductConstraints(items);
                    createFixedElement(items);
                    addCartSection(items);
                    //add the element
                    vaildListener();
                    var timer = document.querySelector('#timer');
                    var timerFixed = document.querySelector('.timer-fixed');
                    updateTimer(timer, openTime, closeTime);
                    updateTimer(timerFixed, openTime, closeTime);
                    //Listener
                    $("input").keydown(function(ev) {
                        if (ev.which == 13) {
                            ev.preventDefault();
                        }
                    });
                    $(".click-able").click(function(ev) {
                        clicked(this);
                    });
                    $(".cartBtn").click(function(ev) {
                        clicked(this);
                    });
                    $("#navBtn").click(function(ev) {
                        if (this.classList.contains("active")) {
                            this.classList.remove("active");
                            document.querySelector("nav").classList.remove("active");
                        } else {
                            this.classList.add("active");
                            document.querySelector("nav").classList.add("active");
                            $(document).on('click', function(ev) {
                                document.querySelector("#navBtn").classList.remove("active");
                                document.querySelector("nav").classList.remove("active");
                                $("body").off('click');
                            });
                            ev.stopPropagation();
                        }
                    });
                    /*date*/
                    $("button.dateBtn").on('click', function(ev) {
                        var dateBtns = this.parentNode.querySelectorAll('.dateBtn');
                        for (var i = 0; i < dateBtns.length; i++) {
                            if (dateBtns[i] == this) {
                                dateBtns[i].classList.add("active");
                                var option = document.querySelector('input[value="' + dateBtns[i].value + '"]');
                                $(option).trigger('click');
                            } else {
                                dateBtns[i].classList.remove("active");
                            }
                        }
                    });
                    $('input[name="date"]').on('click', function(ev) {
                        var dateBtn = document.querySelector('button[value="' + this.value + '"]');
                        var dateBtns = this.parentNode.querySelectorAll('.dateBtn');
                        for (var i = 0; i < dateBtns.length; i++) {
                            if (dateBtns[i] == dateBtn) {
                                dateBtns[i].classList.add("active");
                            } else {
                                dateBtns[i].classList.remove("active");
                            }
                        }
                    });
                    getList(settings['memberList'], function(data) {
                        var d = data.feed.entry;
                        for (var i in d) {
                            members[i] = d[i].gsx$member.$t;
                        }
                        $('[name="studentID"]').on('blur', function(ev) {
                            checkMemberAndCoupon();
                            status();
                        });
                        $('[name="studentID"]').on('input', function(ev) {
                            checkMemberAndCoupon();
                            status();
                        });
                    });
                    getList(settings['couponList'], function(data) {
                        var d = data.feed.entry;
                        for (var i in d) {
                            var c = d[i].gsx$coupon.$t;
                            coupon[c] = {};
                            coupon[c].amount =  parseInt(d[i].gsx$amount.$t);
                            coupon[c].lowerBound =  parseInt(d[i].gsx$lowerbound.$t);
                            coupon[c].merchant = d[i].gsx$merchant.$t.split(', ');
                            coupon[c].description = d[i].gsx$description.$t;
                            coupon[c].activation = new Date(d[i].gsx$activation.$t);
                            var expDay = new Date(d[i].gsx$expiration.$t)
                            coupon[c].expiration = new Date(expDay.setDate(expDay.getDate()+1));
                            var available = moment(coupon[c].activation) - moment() < 0 && moment(coupon[c].expiration) - moment() > 0;
                            if (available) {
                                availableCode.push(c);
                            }
                        }
                        constraints.coupon = couponConstraints;
                        $('[name="coupon"]').on('blur', function(ev) {
                            checkMemberAndCoupon();
                            status();
                        });
                        $('[name="coupon"]').on('input', function(ev) {
                            checkMemberAndCoupon();
                            status();
                        });
                    });

                    var couponConstraints = {
                        inclusion: {
                            within: availableCode,
                            message: "^無效的折扣代碼！",
                        }
                    };
                    var couponConstraintsWithoutMember = {
                        inclusion: {
                            within: [''],
                            message: "^會員優惠不得併用！",
                        }
                    };

                    function checkMemberAndCoupon() {
                        var studentIDItem = document.querySelector('[name="studentID"]');
                        studentIDValue = studentIDItem.value;
                        var studentIDMassage = studentIDItem.nextElementSibling;
                        var couponItem = document.querySelector('[name="coupon"]');
                        couponValue = couponItem.value;
                        var couponMassage = couponItem.nextElementSibling;

                        var errors = validate(form, constraints) || {};

                        isMember = checkMember();
                        isCoupon = checkCoupon();
                        
                        function checkMember() {
                            if (members.indexOf(studentIDValue) != -1 && !('studentID' in errors)) {
                                return true;
                            } else {
                                return false;
                            }
                        };

                        function checkCoupon() {
                            if (availableCode.indexOf(couponValue) != -1 && !('coupon' in errors)) {
                                return true;
                            } else {
                                return false;
                            }
                        };

                        if (isMember) {
                            studentIDMassage.innerHTML = '<p class="help-block error memberText">您為本會會員，享有優惠折扣！</p>';
                            memberPrice();
                            constraints.coupon = couponConstraintsWithoutMember;
                            vaild(couponItem);
                        } else {
                            normalPrice();
                            constraints.coupon = couponConstraints;
                            vaild(couponItem);
                        }
                        if (isCoupon && !isMember) {
                            couponMassage.innerHTML = '<p class="help-block error couponText">' + coupon[couponValue].description + '</p>';
                        }
                            
                    }
                    function memberPrice() {
                        for (var merchant in items) {
                            for (var product in items[merchant]) {
                                var container = document.querySelector('#' + parseCharacter(merchant)).querySelector('#' + parseCharacter(product));
                                var price = items[merchant][product].priceMember;
                                var priceText = container.querySelector('.priceText');
                                    priceText.textContent = price;
                                var priceValue = container.querySelector('.priceValue');
                                    priceValue.value = price;
                            }
                        }
                    }
                    function normalPrice() {
                        for (var merchant in items) {
                            for (var product in items[merchant]) {
                                var container = document.querySelector('#' + parseCharacter(merchant)).querySelector('#' + parseCharacter(product));
                                var price = items[merchant][product].price;
                                var priceText = container.querySelector('.priceText');
                                    priceText.textContent = price;
                                var priceValue = container.querySelector('.priceValue');
                                    priceValue.value = price;
                            }
                        }
                    }
                });
            }
        }
        //load the drop-down list
        function getDepartmentsList(dataset) {
            getList(dataset, function(data) {
                var d = data.feed.entry;
                var depList = [];
                for (var i in d) {
                    var dep = {};
                    dep.index = d[i].gsx$index.$t;
                    dep.department = d[i].gsx$department.$t;
                    dep.disabled = d[i].gsx$disabled.$t;
                    depList.push(dep);
                }
                //console.table(depList);
                // create the the drop-down list
                setDepFragment(depList);
                //load chosen.jquery when the drop-down list were done
                loadSelectChosen();
            });
        }
        function addPickUpDay() {
            var pickUpDay = settings['pickUpDay'];
            var radio = document.querySelector('.radio');
            var radioRow = document.createElement('div');
            radioRow.className = 'radioRow';
            for (var i = 0; i < pickUpDay.length; i++) {
                var dateValue = pickUpDay[i];
                var dateUnix = moment(new Date(dateValue.split(' ')[0])).valueOf()
                var dateText = moment(dateUnix).format('M[月]D[日]');
                var dayNameInWeek = dateValue.split(' ')[1].replace('(', '').replace(')', '');
                var dateBtnText = dateText + '（' + dayNameInWeek + '）';
                var btn = document.createElement('button');
                btn.className = 'dateBtn';
                btn.name = 'dateBtn';
                btn.type = 'button';
                btn.value = dateValue.replace(/\//g, "-");
                btn.innerHTML = dateBtnText;
                radioRow.appendChild(btn);
            }
            radio.appendChild(radioRow);
            for (var i = 0; i < pickUpDay.length; i++) {
                var dateValue = pickUpDay[i];
                var input = document.createElement('input');
                input.className = 'hide';
                input.id = 'd' + (i + 1);
                input.name = 'date';
                input.type = 'radio';
                input.value = dateValue.replace('/', '-').replace('/', '-');
                radio.appendChild(input);
            }
        }

        var orderDict = {};
        //即時消費情形
        function status() {
            var total = 0;
            var output = '';
            var products = document.querySelectorAll('section.products');
                products.forEach(function(productItem) {
                    //console.log(productItem)
                    var merchant = productItem.id;
                    var merchantTotal = 0;
                    orderDict[merchant] = {};
                    var container = productItem.querySelectorAll('div.container');
                        container.forEach(function(containerItem) {
                            //console.log(containerItem)
                            var product = containerItem.id;
                            var order = containerItem.querySelector('div.order');
                            //console.log(order)
                            var price = parseInt(order.querySelector('input.priceValue').value);
                            var quantity = parseInt(order.querySelector('input.quantity').value);
                            var subtotal = price * quantity;
                            merchantTotal += subtotal;
                            if (subtotal > 0) {
                                orderDict[merchant][product] = {};
                                orderDict[merchant][product].price = price;
                                orderDict[merchant][product].quantity = quantity;
                                orderDict[merchant][product].subtotal = subtotal;
                                output += "「" + merchant + '_' + product + " ($" + toCurrency(price) + ")」購買" + quantity + "件，小計" + toCurrency(subtotal) + "元\n";
                            }
                        });
                    if (merchantTotal > 0) {
                        orderDict[merchant].merchantTotal = merchantTotal;
                        orderDict[merchant].discount = 0;
                        total += merchantTotal;
                    } else {
                        delete orderDict[merchant];
                    }
            });

            //message
            output += "總計" + toCurrency(total) + "元\n";

            var totalDiscount = 0;
            var merchantDiscount = 0;

            //json
            discount();
            orderDict.merchantDiscount = merchantDiscount;
            orderDict.totalDiscount = totalDiscount;
            orderDict.total = total - (totalDiscount + merchantDiscount);
            if (orderDict.total < 0) {
                orderDict.total = 0;
            }
            orderDict['outputText'] = output;

            //更新
            updateFixedElement(orderDict, settings['fulfilledPrice']);
            updateCart(orderDict);
            return orderDict;

            function discount() {
                if (isCoupon == true && isMember == false) {
                    var amount = coupon[couponValue].amount;
                    var lowerBound = coupon[couponValue].lowerBound;
                    if (coupon[couponValue].merchant == 'total') {
                        if (total >= lowerBound) {
                            totalDiscount = amount;
                            return;
                        }
                    }
                    coupon[couponValue].merchant.forEach(function(m) {
                        if (m in orderDict) {
                            if (orderDict[m].merchantTotal >= lowerBound) {
                                orderDict[m].discount = amount;
                                merchantDiscount += orderDict[m].discount;
                                orderDict[m].merchantTotal -= orderDict[m].discount;
                                if (orderDict[m].merchantTotal < 0) {
                                    orderDict[m].merchantTotal = 0;
                                }
                            }
                        }
                    });
                    return;
                }
            }
        }

        function updateCart(orderDict) {
            var orderDict = JSON.parse(JSON.stringify(orderDict));
            delete orderDict.outputText;
            var tbody = document.querySelectorAll('tbody');
                tbody.forEach(function(tbodyItem) {
                    var merchant = tbodyItem.id;
                    var tr = tbodyItem.querySelectorAll('tr')
                    tr.forEach(function(trItem) {
                        if (trItem.classList.contains('tr-product')) {
                            var product = trItem.id;
                            if (merchant in orderDict) {
                                if (product in orderDict[merchant]) {
                                    var price = orderDict[merchant][product].price;
                                    var quantity = orderDict[merchant][product].quantity;
                                    var subtotal = orderDict[merchant][product].subtotal;
                                    trItem.childNodes[1].innerHTML = '$' + toCurrency(price);
                                    trItem.childNodes[2].innerHTML = quantity;
                                    trItem.childNodes[4].innerHTML = '$' + toCurrency(subtotal);
                                    trItem.classList.remove('tr-hide');
                                    return;
                                }
                            }
                            var price = 0;
                            var quantity = 0;
                            var subtotal = 0;
                            trItem.childNodes[1].innerHTML = '$' + toCurrency(price);
                            trItem.childNodes[2].innerHTML = quantity;
                            trItem.childNodes[4].innerHTML = '$' + toCurrency(subtotal);
                            trItem.classList.add('tr-hide');
                            return;
                        }
                        if (trItem.classList.contains('merchantTotal')) {
                            if (merchant in orderDict) {
                                var merchantTotal = orderDict[merchant].merchantTotal;
                                trItem.childNodes[4].innerHTML = '$' + toCurrency(merchantTotal);
                                tbodyItem.classList.remove('tbody-hide');
                                return;
                            }
                            var merchantTotal = 0;
                            trItem.childNodes[4].innerHTML = '$' + toCurrency(merchantTotal);
                            tbodyItem.classList.add('tbody-hide');
                            return;
                        }
                        if (trItem.classList.contains('merchantDiscount')) {
                            if (merchant in orderDict) {
                                var merchantDiscount = orderDict[merchant].discount;
                                if (merchantDiscount > 0) {
                                    trItem.childNodes[4].innerHTML = '$' + toCurrency(-merchantDiscount);
                                    trItem.classList.remove('tr-hide');
                                    return;
                                }
                            }
                            var merchantDiscount = 0;
                            trItem.childNodes[4].innerHTML = '$' + toCurrency(merchantDiscount);
                            trItem.classList.add('tr-hide');
                            return;
                        }
                    });
                });
            var discount = document.querySelector('tfoot').querySelector('#totalDiscount');
            if (orderDict.totalDiscount > 0) {
                discount.querySelectorAll('td')[4].innerHTML = '$' + toCurrency(-orderDict.totalDiscount);
                discount.classList.remove('tr-hide');
            } else {
                discount.classList.add('tr-hide');
            }
            var total = document.querySelector('tfoot').querySelector('#totalTotal');
            total.querySelectorAll('td')[4].innerHTML = '$' + toCurrency(orderDict.total);
        }

        function updateFixedElement(orderDict, fulfilledPrice) {
            var bg = document.querySelector("a.bg");
            var products = document.querySelectorAll('.products');
            if (orderDict.total > 0) {
                bg.classList.remove('zero');
                bg.classList.add('nonZero');
                for (var i = 0; i < products.length; i++) {
                    products[i].classList.remove('zero');
                }
            } else {
                bg.classList.remove('nonZero');
                bg.classList.add('zero');
                for (var i = 0; i < products.length; i++) {
                    products[i].classList.add('zero');
                }
            }
            var totalFixed = document.querySelector("#totalFixed");
            totalFixedText = '你已消費&nbsp;$' + toCurrency(orderDict.total);
            if (orderDict.total > fulfilledPrice) {
                totalFixedText += '，可以參加滿額抽獎！'
            } else if (orderDict.total > 0) {
                totalFixedText += '，再加&nbsp;<em>$' + toCurrency(fulfilledPrice - orderDict.total) + '</em>&nbsp;滿額抽！';
            }
            totalFixed.innerHTML = totalFixedText;
            var fulfilled = document.querySelector("#fulfilled");
            fulfilledText = '<br>你已消費&nbsp;$' + toCurrency(orderDict.total);
            if (orderDict.total > fulfilledPrice) {
                fulfilledText += '，可以參加滿額抽獎！'
                fulfilled.classList.add('fulfilled');
            } else if (orderDict.total > 0) {
                fulfilledText += '，再加&nbsp;<em>$' + toCurrency(fulfilledPrice - orderDict.total) + '</em>&nbsp;滿額抽！';
                fulfilled.classList.remove('fulfilled');
            } else {
                fulfilled.classList.remove('fulfilled');
            }
            fulfilled.innerHTML = fulfilledText;
        }

        function dayAvailable() {
            var orders = document.querySelectorAll(".order");
            var dateBtns = document.querySelectorAll('.dateBtn');
            var dTotal = [];
            for (var i = 0; i < dateBtns.length; i++) {
                dTotal[i] = true;
                for (var j = 0; j < orders.length; j++) {
                    var quantity = orders[j].parentNode.parentNode.querySelector('.quantity').value;
                    var d = orders[j].parentNode.parentNode.querySelector('.d' + (i + 1)).value;
                    if (d * Math.abs(quantity) < 0) {
                        dTotal[i] = false;
                        break;
                    }
                }
            }
            var dateConstraints = {
                date: {
                    exclusion: {
                        within: [],
                        message: "^您所選購的商品當中\n含有無法在 %{value} 取貨的品項！",
                    },
                }
            };
            /*處理禁用選項的部分*/
            for (var i = 0; i < dTotal.length; i++) {
                dateHandler(dTotal[i], dateBtns[i]);
                var within = dateConstraints['date']['exclusion']['within'];
                if (dTotal[i] == false) {
                    within.push(dateBtns[i].value);
                } else {
                    if (within.indexOf(dateBtns[i].value) != -1) {
                        within.splice(within.indexOf(dateBtns[i].value));
                    }
                }
            }
            constraints['date']['exclusion'] = dateConstraints['date']['exclusion'];

            function dateHandler(dTotal, dateBtn) {
                var dateOpt = dateBtn.parentNode.querySelector('input[name="date"]');
                var dateOpt = document.querySelector('input[value="' + dateBtn.value + '"]');
                if (dTotal == false) {
                    dateBtn.classList.remove('active');
                    dateBtn.disabled = true;
                    dateOpt.disabled = true;
                } else {
                    if (dateOpt.checked == true) {
                        dateBtn.classList.add('active');
                    }
                    dateBtn.disabled = false;
                    dateOpt.disabled = false;
                }
            }
        }

        var errors = {};
        function vaild(item) {
            var form = document.querySelector('#form');
            status();
            dayAvailable();
            errors = validate(form, constraints) || {};
            showIsErrorsForInput(item, errors[item.name]);
            if (item.classList.contains("quantity")) {
                removeEachEmpty(item);
            }
            if ('date' in errors) {
                if (errors['date'][0].substring(0, 2) == constraints['date']['exclusion']['message'].substring(1, 3)) {
                    showIsErrorsForInput(document.querySelector('.radio'), errors['date']);
                }
            } else {
                resetFormGroup(findParentNode(document.querySelector('.radio')));
                showIsErrorsForInput(document.querySelector('.radio'), errors['date']);
            }
            if ('coupon' in errors) {
                showIsErrorsForInput(document.querySelector('[name="coupon"]'), errors['coupon']);
            } else {
                resetFormGroup(findParentNode(document.querySelector('.radio')));
                showIsErrorsForInput(document.querySelector('[name="coupon"]'), errors['coupon']);
            }
        }
        //表單驗證區
        function vaildListener() {
            (function() {
                // Hook up the form so we can prevent it from being posted
                var form = document.querySelector('#form');
                form.addEventListener("submit", function(ev) {
                    ev.preventDefault();
                    handleFormSubmit(form);
                });
                // Hook up the inputs to validate on the fly
                var inputs = document.querySelectorAll("input, textarea, select, .click-able")
                for (var i = 0; i < inputs.length; ++i) {
                    $(inputs.item(i)).on('input', function(ev) {
                        vaild(this);
                    });
                    $(inputs.item(i)).on('blur', function(ev) {
                        vaild(this);
                    });
                    $(inputs.item(i)).on('click', function(ev) {
                        vaild(this);
                    });
                    $(".chosen-select").on('change', function(ev) {
                        vaild(this);
                    });
                }

                function handleFormSubmit(form) {
                    // validate the form against the constraints
                    var errors = validate(form, constraints);
                    // then we update the form to reflect the results
                    showIsErrors(form, errors || {});
                    var errorMessage = "表單內容有誤，請檢視錯誤訊息後重新輸入！";
                    if (!errors) {
                        doSuccess();
                    } else {
                        doError(errorMessage);
                    }
                }

                function doError(message) {
                    //表單驗證失敗
                    var inputs = ($('.quantity'))
                    for (var i = 0; i < inputs.length; i++) {
                        if ($(inputs[i]).val() == 0) {
                            var formGroup = findParentNode(inputs[i]);
                            resetFormGroup(formGroup);
                        }
                    }
                    alert(message);
                }

                function doSuccess() {
                    submitForm();
                }
            }
            )();
            //最後的括號是必要且不可刪除的
        }
        // Updates the inputs with the validation errors
        function showIsErrors(form, errors) {
            // We loop through all the inputs and show the errors for that input
            _.each(form.querySelectorAll("input[name], select[name]"), function(input) {
                // Since the errors can be null if no errors were found we need to handle that
                var e = errors && errors[input.name];
                showIsErrorsForInput(input, e);
            });
        }

        function findParentNode(node) {
            var node = node.parentNode;
            if (node.classList.contains("formRow") || node.classList.contains("container")) {
                return node;
            } else {
                return findParentNode(node);
            }
        }
        // Shows the errors for a specific input
        function showIsErrorsForInput(input, errors) {
            var messagesClassName = ".messages";
            // This is the root of the input
            var formGroup = findParentNode(input);
            var messages = formGroup.querySelector(messagesClassName);
            // First we remove any old messages and resets the classes
            resetFormGroup(formGroup);
            // If we have errors
            if (errors) {
                // we first mark the group has having errors
                formGroup.classList.add("has-error");
                // then we append all the errors
                _.each(errors, function(error) {
                    addError(messages, error);
                });
            } else {
                // otherwise we simply mark it as success
                if (formGroup != form) {
                    formGroup.classList.add("has-success");
                }
            }
        }

        function resetFormGroup(formGroup) {
            // Remove the success and error classes
            formGroup.classList.remove("has-error");
            formGroup.classList.remove("has-success");
            // and remove any old messages
            _.each(formGroup.querySelectorAll(".help-block.error"), function(el) {
                if (!(el.classList.contains('memberText') || el.classList.contains('couponText'))) {
                    el.parentNode.removeChild(el);
                } else {
                    if (('studentID' in errors) && el.classList.contains('memberText')) {
                        el.parentNode.removeChild(el);
                    }
                    if (('coupon' in errors) && el.classList.contains('couponText')) {
                        el.parentNode.removeChild(el);
                    }
                }
                
            });
        }
        // Adds the specified error with the following markup
        // <p class="help-block error">[message]</p>
        function addError(messages, error) {
            var block = document.createElement("p");
            block.classList.add("help-block");
            block.classList.add("error");
            block.innerText = error;
            messages.appendChild(block);
        }

        function removeEachEmpty(item) {
            if (item.value === '0') {
                resetFormGroup(findParentNode(item));
            }
        }
        //when the count input was clicked
        function clicked(item) {
            if (item.classList[0] == "click-able") {
                var quantity = item.parentNode.parentNode.querySelector('.quantity');
            } else {
                var quantity = document.querySelector('[name="quantity_' + item.name + '"]');
            }
            var upperLimit = parseInt(quantity.parentNode.parentNode.querySelector('.upperLimit').value);
            //onclick
            if (item.classList[1] == "inc") {
                if (parseInt(quantity.value) < 0) {
                    quantity.value = 1;
                } else if (parseInt(quantity.value) >= upperLimit && item.classList[0] != "click-able") {
                    quantity.value = upperLimit;
                } else if (parseInt(quantity.value) >= (upperLimit + 1) && item.classList[0] == "click-able") {
                    quantity.value = upperLimit + 1;
                } else if (quantity.value == "") {
                    quantity.value = 1;
                } else {
                    quantity.value = parseInt(quantity.value) + 1;
                }
            }
            if (item.classList[1] == "dec") {
                if (parseInt(quantity.value) >= 1) {
                    if (parseInt(quantity.value) >= (upperLimit + 1)) {
                        quantity.value = upperLimit;
                    } else {
                        quantity.value = parseInt(quantity.value) - 1;
                    }
                } else if (quantity.value == "" || parseInt(quantity.value) < 0) {
                    quantity.value = 0;
                }
            }
            if (item.classList[1] == "remove") {
                quantity.value = 0;
            }
            vaild(quantity);
            $(item).on('click', function(ev) {
                vaild(quantity);
            });
            $(item).on('focus', function(ev) {
                vaild(quantity);
            });
            $(item).on('blur', function(ev) {
                vaild(quantity);
            });
        }
        /*submit*/
        //action for submit the form
        function submitForm() {
            // 表單驗證成功
            // contents of submitting
            var orderDict = status();
                //orderDict
            // 驗證總金額是否為0
            if (orderDict.total <= 0) {
                alert("你似乎沒購買任何商品！");
                var inputs = ($('.quantity'))
                for (var i = 0; i < inputs.length; i++) {
                    if ($(inputs[i]).val() == 0) {
                        var formGroup = findParentNode(inputs[i]);
                        resetFormGroup(formGroup);
                    }
                }
                return;
            } else {
                var fulfilledPrice = parseInt(settings['fulfilledPrice']);
                if (orderDict.total < fulfilledPrice) {
                    var msg = '再加 $' + toCurrency(fulfilledPrice - orderDict.total) + ' 就可以參加滿額抽獎！\n確定要現在結帳？';
                } else {
                    var msg = '你可以參加滿額抽獎！確定要結帳？';
                }
                if (!confirm(msg)) {
                    var inputs = ($('.quantity'))
                    for (var i = 0; i < inputs.length; i++) {
                        if ($(inputs[i]).val() == 0) {
                            var formGroup = findParentNode(inputs[i]);
                            resetFormGroup(formGroup);
                        }
                    }
                    return;
                }
            }
            // show checkout alert
            alert('【結帳 Checkout】\n' + orderDict['outputText']);
            // prepare the post data
            var email = $('[name="email"]').val() || '未填寫';
            // confirm to post order
            if (!confirm("按下確定以送出訂單\n確認信將會寄至：" + email)) {
                var inputs = ($('.quantity'))
                for (var i = 0; i < inputs.length; i++) {
                    if ($(inputs[i]).val() == 0) {
                        var formGroup = findParentNode(inputs[i]);
                        resetFormGroup(formGroup);
                    }
                }
                return;
            }
            // prepare the post data
            var name = $('[name="name"]').val() || '未填寫';
            var studentID = $('[name="studentID"]').val() || '未填寫';
            var department = $('[name="department"]').val() || '未填寫';
            var grade = $('[name="grade"]').val() || '未填寫';
            var phoneNumber = $('[name="phoneNumber"]').val() || '未填寫';
            var time = function() {
                var selected;
                $('[name="date"]').each(function() {
                    if ($(this).prop("checked") === true)
                        selected = $(this).val();
                });
                if (!selected) {
                    selected = '未填寫';
                }
                return selected;
            }
            var total = orderDict.total;
            // client info
            var now = moment(moment().valueOf()).format('YYYY-MM-DD HH:mm:ss');
            var href = window.location.href;
            var orderNumber = moment(now).format('MMDDHH') + pad(settings['orderNumber'], 4)
            //create the json construction
            var dict = {
                "timestamp": now,
                "name": name,
                "studentID": studentID,
                "department": department,
                "grade": grade,
                "phoneNumber": phoneNumber,
                "email": email,
                "time": time(),
                "total": total,
                "order": orderDict,
                "href": href,
                "orderNumber": orderNumber,
            };
            var postData = dict;
            postData['jsonRaw'] = JSON.stringify(dict);

            var publicDict = {
                "timestamp": now,
                "orderNumber": orderNumber,
                "href": href,
                "order": orderDict,
            };
            postData['jsonRawPublic'] = JSON.stringify(publicDict);

            postData['method'] = "write";
            // do ajax submit
            $.ajax({
                type: "post",
                data: postData,
                url: "https://script.google.com/macros/s/AKfycbw-DnUUzyCPoS8F6QKOz12o9S8_pwamMN0cpWjxPE38f3wyWRAj/exec",
                // 填入網路應用程式網址
                success: function(e) {
                    alert(e);
                }
            });
            //finished
            sendMail(dict);
        }
        //寄信+跳轉
        function sendMail(dict) {
            var mailBody = '<div style="margin:1em; padding:1em; background-color: #FFD;">';
            mailBody += '<p>';
            mailBody += dict['department'].substring(4) + dict['grade'].substring(2) + '<br />';
            mailBody += '<span style="color: #00F; font-weight: 1000; font-size: 1.5em;">' + dict['name'] + '</span>&nbsp;你好';
            mailBody += '</p>';
            mailBody += '<p style="border-top: 1px #000 solid; border-bottom: 1px #000 solid; line-height: 2em;">';
            mailBody += '您在本次蘭陽週預購之商品訂單如下'
            mailBody += '</p>';
            //shopping cart
            var index = 0;
            for (var order in dict['quantity']) {
                if (index < Object.keys(dict['quantity']).length - 2) {
                    if (dict['quantity'][order]['subtotal'] > 0) {
                        mailBody += '<span style="color: #F00; font-weight: 1000;">';
                        mailBody += dict['quantity'][order]['quantity'];
                        mailBody += '</span>';
                        mailBody += '&nbsp;件';
                        mailBody += '「';
                        mailBody += '<span style="font-weight: 1000;">' + order + '</span>' + '&nbsp;' + '($' + toCurrency(dict['quantity'][order]['price']) + ')';
                        mailBody += '」<br />';
                    }
                }
                index++;
            }
            mailBody += '<p style="font-size:1.5em;">';
            mailBody += '總金額為&nbsp;<span style="color: #F00; font-weight: 1000;">' + toCurrency(dict['total']) + '</span>&nbsp;元';
            mailBody += '</p>';
            mailBody += '<p style="border-top: 1px #000 solid; border-bottom: 1px #000 solid; line-height:2em;">';
            mailBody += "以下為領取人（您）的聯絡資料"
            mailBody += '</p>';
            mailBody += '<p>';
            mailBody += '姓名：<span style="font-weight: 1000;">' + dict['name'] + '</span>' + '<br />';
            mailBody += '學號：<span style="font-weight: 1000;">' + dict['studentID'] + '</span>' + '<br />';
            mailBody += '手機：<span style="font-weight: 1000;">' + dict['phoneNumber'] + '</span>' + '<br />';
            mailBody += '取貨時間：<span style="font-weight: 1000; background-color: #FF0;">' + dict['time'] + '&nbsp;12:00-17:00</span>' + '<br />';
            mailBody += '取貨地點：<span style="font-weight: 1000; background-color: #FF0;">商院中庭</span>' + '<br />';
            mailBody += '（時間地點如有變更將在粉絲專頁公布）'
            mailBody += '</p>';
            mailBody += '<p style="border-bottom: 1px #000 solid; line-height:2em;">';
            mailBody += '</p>';
            mailBody += '<p style="font-size: 0.75em;">';
            mailBody += settings['mailBodyNotice'];
            mailBody += '</p>';
            mailBody += '<p style="font-size: 1em;">';
            mailBody += '蘭陽週團隊感謝您訂購'
            mailBody += '</p>';
            mailBody += '<p style="border-bottom: 1px #000 solid; line-height:2em;">';
            mailBody += '</p>';
            mailBody += '<p>';
            mailBody += settings['mailBodyInfo'];
            mailBody += '</p>';
            mailBody += '<p style="border-bottom: 1px #000 solid; line-height:2em;">';
            mailBody += '</p>';
            mailBody += '<p style="font-size: 0.75em;">';
            mailBody += '您的訂單已於&nbsp;' + dict['timestamp'] + '&nbsp;送出';
            mailBody += '</p>';
            mailBody += '</div>';
            Email.send({
                Host: settings['emailHost'],
                Username: settings['emailUsername'],
                Password: settings['emailPassword'],
                To: dict['email'],
                //email
                From: settings['emailFrom'],
                Subject: settings['mailSubjectForCustomer'],
                Body: mailBody,
            }).then(function(message) {
                if (message != "OK") {
                    alert("確認信寄送失敗！請速洽蘭友會粉絲專頁。");
                } else {
                    alert("訂單已送出！確認信已寄至您的電子郵件信箱！");
                }
            });
            var mailBodyCopy = '<p style="border-top: 1px #000 solid; border-bottom: 1px #000 solid; line-height:2em;">';
            mailBodyCopy += '⚠️以下是&nbsp;' + dict['name'] + '&nbsp;的消費紀錄⚠️';
            mailBodyCopy += '</p>';
            mailBodyCopy += mailBody;
            Email.send({
                Host: settings['emailHost'],
                Username: settings['emailUsername'],
                Password: settings['emailPassword'],
                To: settings['emailUsername'],
                //email
                From: settings['emailFrom'],
                Subject: settings['mailSubjectForUs'],
                Body: mailBodyCopy,
            }).then(function(message) {
                if (message != "OK") {
                    alert("確認信寄送失敗！請速洽蘭友會粉絲專頁。");
                } else {
                    $('[href="assets/style.css"]').removeAttr("href");
                    var body = document.querySelector('body')
                    body.innerHTML = mailBody;
                }
            });
        }
        /*fixed*/
        var constraints = {
            // These are the constraints used to validate the form
            name: {
                presence: {
                    message: "^您必須填寫姓名！\n難道你是無名氏逆？",
                },
                format: {
                    pattern: "^([A-Za-z ,-]|[\u4E00-\u9FFF．]|[^\x00-\xFF]])+$",
                    message: "^您填寫的姓名格式無效！\n你的名字沒這麼奇怪吧？（如果這確實是你的真名，請立刻和我們聯絡）",
                }
            },
            studentID: {
                presence: {
                    message: "^您必須填寫政大學號！",
                },
                format: {
                    pattern: "(^10[0-8][0-9]{6}$|^999999999$)",
                    message: "^您填寫的政大學號格式無效！\n（嘗試填寫此欄卻失敗者，請輸入9個9並立刻和我們聯絡，訂單方會成立）",
                }
            },
            department: {
                presence: {
                    message: "^您必須填寫系所！\n（無適當選項可選者，請選擇XXX並立刻和我們聯絡，訂單方會成立）",
                },
            },
            grade: {
                presence: {
                    message: "^您必須填寫年級！\n（無適當選項可選者，請立刻和我們聯絡）",
                },
            },
            phoneNumber: {
                presence: {
                    message: "^您必須填寫手機號碼！\n我們需要和你聯絡及確認訂單！",
                },
                format: {
                    pattern: "^09[0-9]{8}$",
                    message: "^您必須填寫臺灣的手機門號！（無需加入符號）",
                }
            },
            email: {
                presence: {
                    message: "^您必須填寫 E-mail！\n我們需要和你聯絡及確認訂單！",
                },
                email: {
                    message: "^您填寫的 E-mail 的格式無效！",
                },
            },
            date: {
                presence: {
                    message: "^您必須填寫日期！\n難道你不來取貨嗎？",
                },
                exclusion: {},
            },
        };

        function addProductConstraints(items) {
            for (var merchant in items) {
                for (var product in items[merchant]) {
                    var fullName = merchant + '_' + product;
                    var upperLimit = items[merchant][product].upperLimit;
                    var productConstraints = {
                        presence: {
                            message: "^您必須填寫此品項的購買數量！",
                        },
                        numericality: {
                            onlyInteger: true,
                            greaterThanOrEqualTo: 0,
                            lessThanOrEqualTo: parseInt(upperLimit),
                            notInteger: "^此品項購買數量只能是正整數！",
                            notGreaterThanOrEqualTo: "^此品項購買數量只能是正整數！",
                            notLessThanOrEqualTo: "^此品項購買數量已達本表單上限！如需訂購更多請直接向我們洽詢！",
                        },
                    };
                    var productName = 'quantity_' + fullName;
                    constraints[productName] = productConstraints;
                }
            }
        }
        //set dep drop-down list
        function setDepFragment(depList) {
            var setDepFragment = document.createDocumentFragment();
            for (var i = 0; i < depList.length; i++) {
                var depOpt = document.createElement('option');
                depOpt.value = depList[i].index + '-' + depList[i].department;
                depOpt.textContent = depList[i].department + ' (' + depList[i].index + ')';
                depOpt.disabled = depList[i].disabled;
                setDepFragment.appendChild(depOpt);
            }
            document.getElementById('department').appendChild(setDepFragment);
        }
        //define the func load chosen.jquery
        function loadSelectChosen() {
            $('.chosen-select').chosen({
                search_contains: true,
                width: '100%',
                no_results_text: "找不到",
                disable_search_threshold: 10,
            });
        }

        function createFixedElement(items) {
            var merchantsList = document.querySelector("#merchantsList");
                var li = document.createElement("li");
                    li.innerHTML = '<a class="bg" href="#info">買家基本資料</a>';
                merchantsList.appendChild(li);
                for (var merchant in items) {
                    var li = document.createElement("li");
                        li.innerHTML = '<a class="bg" href="#' + merchant + '">' + merchant + '</a>';
                    merchantsList.appendChild(li);
                }
        }

        function addCartSection(items) {
            var table = document.querySelector('#cartTable');
            for (var merchant in items) {
            var tbody = document.createElement('tbody');
                tbody.id = merchant;
                tbody.classList.add('tbody-hide');
                var tr = document.createElement("tr");
                    tr.className = 'merchantTitle';
                    tr.innerHTML = '<th colspan="5">' + merchant + '</th>';
                tbody.appendChild(tr);
                for (var product in items[merchant]) {
                    var price = items[merchant][product].price;
                    var tr = document.createElement("tr");
                        tr.className = 'tr-product';
                        tr.id = product;
                        tr.innerHTML += '<td>' + product.replace(/_/g,' ') + '</td>';
                        tr.innerHTML += '<td>$' + toCurrency(price) + '</td>';
                        tr.innerHTML += '<td>' + 0 + '</td>';
                        var td = document.createElement('td');
                            var div = document.createElement('div');
                                div.innerHTML += '<button type="button" class="cartBtn dec" name="' + merchant + '_' + product + '"><i class="fas fa-minus"></i></button>'
                                div.innerHTML += '<button type="button" class="cartBtn inc" name="' + merchant + '_' + product + '"><i class="fas fa-plus"></i></button>'
                                div.innerHTML += '<button type="button" class="cartBtn remove" name="' + merchant + '_' + product + '"><i class="fas fa-trash-alt"></i></button>'
                            td.appendChild(div);
                        tr.appendChild(td);
                        tr.innerHTML += '<td>$' + toCurrency(0) + '</td>';
                        tr.classList.add('tr-hide');
                    tbody.appendChild(tr);
                }
                var tr = document.createElement("tr");
                    tr.className = 'merchantDiscount tr-hide';
                    tr.innerHTML = '<td>' + merchant + '折扣</td><td></td><td></td><td></td><td>$' + toCurrency(0) + '</td>';
                tbody.appendChild(tr);
                var tr = document.createElement("tr");
                    tr.className = 'merchantTotal';
                    tr.innerHTML = '<td>' + merchant + '總計</td><td></td><td></td><td></td><td>$' + toCurrency(0) + '</td>';
                tbody.appendChild(tr);
            table.insertBefore(tbody, document.querySelector('tfoot'));
            }
        }
        //Section of Merchant of products list
        function addProducts(items) {
            var pickUpDay = settings['pickUpDay'];
            var d1Text = moment(moment(new Date(pickUpDay[0].split(' ')[0])).valueOf()).format('M[月]D[日]');
            var d2Text = moment(moment(new Date(pickUpDay[1].split(' ')[0])).valueOf()).format('M[月]D[日]');
            for (var merchant in items) {
                var section = document.createElement('section');
                    section.className = 'products';
                    section.id = merchant;
                    section.innerHTML = '<p class="title">' + merchant + '</p>';
                for (var product in items[merchant]) {
                    var fullName = merchant + '_' + product;
                    var price = items[merchant][product].price;
                    var d1 = items[merchant][product].d1;
                    var d2 = items[merchant][product].d2;
                    var upperLimit = items[merchant][product].upperLimit;
                    var link = items[merchant][product].link;
                    var pic = items[merchant][product].pic;
                    if (product == 'info') {
                        section.innerHTML += '<div class="info">' + items[merchant][product] + '</div>';
                        delete items[merchant][product];
                    } else {
                        //container
                        var container = document.createElement('div');
                            container.className = 'container';
                            container.id = product;
                            //pic
                            container.innerHTML += '<div class="pic"><img src="' + pic + '"></div>'
                            //products name with link
                            container.innerHTML += '<div class="goods"><a href="' + link + '" target="' + (link != "#" ? '_blank' : '') + '">' + product.replace(/_/g,' ') + '</div>'
                            //products price
                            container.innerHTML += '<div class="price"><span class="priceText">' + toCurrency(price) + '</span></div>'
                            //products quantity
                            var orderContainer = document.createElement('div');
                                orderContainer.className = 'orderContainer';
                                var meta = document.createElement('div');
                                    meta.className = 'meta';
                                    meta.innerHTML += '<button class="d1' + (d1 < 0 ? ' disabled' : '') + '" type="" name="d1-' + fullName + '" value="' + d1 + '" disabled="disabled">' + d1Text + '<br>取貨</button>';
                                    meta.innerHTML += '<button class="d2' + (d2 < 0 ? ' disabled' : '') + '" type="" name="d2-' + fullName + '" value="' + d2 + '" disabled="disabled">' + d2Text + '<br>取貨</button>';
                                    meta.innerHTML += '<button class="upperLimit" type="" name="price_' + fullName + '" value="' + upperLimit + '" disabled="disabled">上限：' + upperLimit + '</button>';
                                var order = document.createElement('div');
                                    order.className = 'order';
                                    order.id = fullName;
                                    order.innerHTML += '<input class="priceValue" type="hidden" name="price_' + fullName + '" value="' + price + '">';
                                    //dec btn
                                    order.innerHTML += '<button type="button" class="click-able dec"><i class="fas fa-minus"></i></button>';
                                    //quantity input
                                    order.innerHTML += '<input class="quantity" type="number" name="quantity_' + fullName + '" value="0" min="0">';
                                    //inc btn
                                    order.innerHTML += '<button type="button" class="click-able inc"><i class="fas fa-plus"></i></button>';
                                    //remove btn
                                    order.innerHTML += '<button type="button" class="click-able remove"><i class="fas fa-trash-alt"></i></button>';
                                orderContainer.appendChild(meta);
                                orderContainer.appendChild(order);
                            container.appendChild(orderContainer);
                            container.innerHTML += '<div class="messages"></div>'
                            section.appendChild(container);
                    }
                }
                form.insertBefore(section, document.querySelector('#cart'));
            }
        }

        function pad(str, length) {
            if(str.length >= length) {
                return str;
            } else {
                return pad('0' + str , length);
            }
        }
        function parseCharacter(text) {
            /*
            var t = text;
            t.replace(/!/g,'\\!');
            t.replace(/@/g,'\\@');
            t.replace(/\$/g,'\\$');
            t.replace(/%/g,'\\%');
            t.replace(/\^/g,'\\^');
            t.replace(/&/g,'\\&');
            t.replace(/\(/g,'\\(');
            t.replace(/\)/g,'\\)');
            t.replace(/_/g,'\\_');
            t.replace(/</g,'\\<');
            t.replace(/>/g,'\\>');
            t.replace(/{/g,'\\{');
            t.replace(/}/g,'\\}');
            t.replace(/\[/g,'\\[');
            t.replace(/\]/g,'\\]');
            t.replace(/\?/g,'\\?');
            t.replace(/\//g,'\\/');
            //t.replace(/#/g,'\\#');
            //t.replace(/\\/g,'\\\\');
            */
            //t.replace(/\*/g,'\\*');
            return text.replace(/!/g,'\\!').replace(/@/g,'\\@').replace(/\$/g,'\\$').replace(/%/g,'\\%').replace(/\^/g,'\\^').replace(/&/g,'\\&').replace(/\*/g,'\\*').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/_/g,'\\_').replace(/</g,'\\<').replace(/>/g,'\\>').replace(/{/g,'\\{').replace(/}/g,'\\}').replace(/\[/g,'\\[').replace(/\]/g,'\\]').replace(/\?/g,'\\?').replace(/\//g,'\\/');
        }
        //千分位
        function toCurrency(num) {
            var parts = num.toString().split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return parts.join('.');
        }
    });
});