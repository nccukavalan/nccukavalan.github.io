$(function() {
    $.when(
        $.get("https://spreadsheets.google.com/feeds/list/1ZBvqBmEYO8D8f3CxoVZMVjBbbOGqLfDQuAkDJxneTsg/1/public/values?alt=json")
    ).then(function(data) {
        var d = data.feed.entry;
        var settings = {};
        for (var i in d) {
            settings[d[i].gsx$key.$t] = d[i].gsx$value.$t;
            if (d[i].gsx$key.$t == "pickUpDay") {
                settings[d[i].gsx$key.$t] = d[i].gsx$value.$t.split(', ');
            }
        }

        var timer = setInterval(function() {
            var now = moment().valueOf();
            var timerText = document.querySelector('.timer');
                timerText.innerHTML = ''

            var y = settings['openYear'];
            var m = settings['openMonth'];
            var d = settings['openDay'];
            //var d = 1;
            var openTime = moment([y, m - 1, d]);

            var openDiff = diff(openTime);

            var y = settings['closeYear'];
            var m = settings['closeMonth'];
            var d = settings['closeDay'];
            //var d = 8;
            var closeTime = moment([y, m - 1, d + 1]);

            var closeDiff = diff(closeTime);

            if (openDiff['diff'] <= 0 && closeDiff['diff'] > 0 ) {
                checkTimesUp(openDiff['diff']);

                function checkTimesUp(openDiff) {
                    if(openDiff < 0){
                        main();
                        clearInterval(timer);
                    }
                }

            }

            if (openDiff['diff'] > 0) {
                timerText.innerHTML += '<p>距離預購開始還有' + openDiff['text'] + '！</p>';
            } else {
                timerText.innerHTML += '<p>真可惜，你晚了' + closeDiff['text'] + '才來！</p>';
            }

            function diff(t) {
                var timeStart = moment().valueOf();
                var timeEnd = t.valueOf();
                var diff = moment.duration(timeEnd - timeStart);

                var d = Math.abs(diff.days());
                var h = Math.abs(diff.hours());
                var m = Math.abs(diff.minutes());
                var s = Math.abs(diff.seconds());

                var diffText = ''
                    if ((d) != 0) {
                        diffText += d;
                        diffText += '天';
                    }
                    if ((d + h) != 0) {
                        diffText += h;
                        diffText += '小時';
                    }
                    if ((d + h + m) != 0) {
                        diffText += m;
                        diffText += '分';
                    }
                    if ((d + h + m + s) != 0) {
                        diffText += s;
                        diffText += '秒';
                    }
                return {'diff': diff, 'text': diffText};
            }
        },'1000');
    //main();

    var pickUpDay = settings['pickUpDay'];

function main() {
    document.querySelector('.wrapper').classList.add('hide');
    console.log(settings);

    //load the drop-down list
    $.get("https://spreadsheets.google.com/feeds/list/" + settings['departmentsList'] + "/1/public/values?alt=json", function(data) {
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
    //create product list and items set
    $.get("https://spreadsheets.google.com/feeds/list/" + settings['productsList'] + "/1/public/values?alt=json", function(data) {
        var d = data.feed.entry;
        var items = [];
        for (var i in d) {
            var item = {};
            item.merchant = d[i].gsx$merchant.$t;
            item.product = d[i].gsx$product.$t;
            item.price = d[i].gsx$price.$t;
            item.priceMember = d[i].gsx$pricemember.$t;
            item.d1 = d[i].gsx$d1.$t;
            item.d2 = d[i].gsx$d2.$t;
            item.upperLimit = d[i].gsx$upperlimit.$t;
            item.link = d[i].gsx$link.$t;
            item.pic = d[i].gsx$pic.$t;
            items.push(item);
        }
        //console.table(items);
        //add the element
        addProductsList(items);
        addProductConstraints(items);
        createFixedElement();
        vaildListener(items);
        addCartSection(items);
        //Listener
        $("input").keydown(function(ev) {
            if (ev.which == 13) {
                ev.preventDefault();
            }
        });
        $(".click-able").click(function(ev) {
            clicked(this, items);
        });
        $(".cartBtn").click(function(ev) {
            clicked(this, items);
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
        $.get("https://spreadsheets.google.com/feeds/list/" + settings['memberList'] + "/1/public/values?alt=json", function(data) {
            var d = data.feed.entry;
            var members = [];
            for (var i in d) {
                members[i] = d[i].gsx$member.$t;
            }
            $('[name="studentID"]').on('blur', function(ev) {
                isMember(this, items);
                status();
            });
            $('[name="studentID"]').on('input', function(ev) {
                isMember(this, items);
                status();
            });

            function isMember(item, items) {
                var value = $(item).val();
                var massage = item.nextElementSibling;
                if (members.indexOf(value) != -1) {
                    if (!massage.innerHTML) {
                        massage.innerHTML = '<p class="help-block error memberText">您為本會會員，享有優惠折扣！</p>';
                        memberPrice(items);
                    }
                } else {
                    normalPrice(items);
                }

                function memberPrice(items) {
                    for (var i = 0; i < items.length; i++) {
                        status();
                        var id = "container-" + items[i].merchant + "-" + items[i].product;
                        var container = document.getElementById(id);
                        var priceText = container.querySelector('.priceText');
                        priceText.textContent = items[i].priceMember;
                        var priceValue = container.querySelector('.priceValue');
                        priceValue.value = items[i].priceMember;
                    }
                }

                function normalPrice(items) {
                    for (var i = 0; i < items.length; i++) {
                        var id = "container-" + items[i].merchant + "-" + items[i].product;
                        var container = document.getElementById(id);
                        var priceText = container.querySelector('.priceText');
                        priceText.textContent = items[i].price;
                        var priceValue = container.querySelector('.priceValue');
                        priceValue.value = items[i].price;
                    }
                }
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
    });
}

//即時消費情形
function status() {
    var orders = document.querySelectorAll(".order");
    var total = 0;
    var output = "";
    var orderDict = {};
    for (var i = 0; i < orders.length; i++) {
        var productName = orders[i].id;
        var price = orders[i].parentNode.parentNode.querySelector('.priceValue').value;
        var quantity = orders[i].parentNode.parentNode.querySelector('.quantity').value;
        var subtotal = price * quantity;
        total += subtotal;
        //message
        if (subtotal > 0) {
            output += "「" + productName + " ($" + toCurrency(price) + ")」購買" + quantity + "件，小計" + toCurrency(subtotal) + "元\n";
        }
        //json
        orderDict[productName] = {
            'price': price,
            'quantity': quantity,
            'subtotal': subtotal
        };
    }
    //message
    output += "總計" + toCurrency(total) + "元\n";
    //json
    orderDict['total'] = total;
    orderDict['outputText'] = output;
    /*滿額門檻*/
    var fulfilledPrice = settings['fulfilledPrice'];
    //更新
    updateFixedElement(orderDict, fulfilledPrice);
    updateCart(orderDict);
    return orderDict;
}

function updateCart(orderDict) {
    var index = 0;
    for (var order in orderDict) {
        var tr = document.getElementById("tr-" + order);
        if (index >= Object.keys(orderDict).length - 2) {
            if (index == Object.keys(orderDict).length - 2) {
                tr.childNodes[4].textContent = '$' + toCurrency(orderDict['total']);
            }
        } else {
            tr.childNodes[0].textContent = order;
            tr.childNodes[1].textContent = '$' + toCurrency(orderDict[order]['price']);
            tr.childNodes[2].textContent = orderDict[order]['quantity'];
            tr.childNodes[4].textContent = '$' + toCurrency(orderDict[order]['subtotal']);
            if (orderDict[order]['subtotal'] > 0) {
                tr.className = 'tr-show';
            } else {
                tr.className = 'tr-hide'
            }
        }
        index++;
    }
}

function updateFixedElement(orderDict, fulfilledPrice) {
    var bg = document.querySelector("a.bg");
    var sectionProductsList = document.querySelectorAll('.sectionProductsList');
    if (orderDict['total'] > 0) {
        bg.style.backgroundColor = '#CFC';
        for (var i = 0; i < sectionProductsList.length; i++) {
            sectionProductsList[i].style.backgroundColor = "";
        }
    } else {
        bg.style.backgroundColor = '#FCC';
        for (var i = 0; i < sectionProductsList.length; i++) {
            sectionProductsList[i].style.backgroundColor = "#FCC";
        }
    }
    var totalFixed = document.querySelector("#totalFixed");
    totalFixedText = '你已消費&nbsp;$' + toCurrency(orderDict['total']);
    if (orderDict['total'] > fulfilledPrice) {
        totalFixedText += '，可以參加滿額抽獎！'
    } else if (orderDict['total'] > 0) {
        totalFixedText += '，再加&nbsp;<em>$' + toCurrency(fulfilledPrice - orderDict['total']) + '</em>&nbsp;滿額抽！';
    }
    totalFixed.innerHTML = totalFixedText;
    var fulfilled = document.querySelector("#fulfilled");
    fulfilledText = '<br>你已消費&nbsp;$' + toCurrency(orderDict['total']);
    if (orderDict['total'] > fulfilledPrice) {
        fulfilledText += '，可以參加滿額抽獎！'
        fulfilled.classList.add('fulfilled');
    } else if (orderDict['total'] > 0) {
        fulfilledText += '，再加&nbsp;<em>$' + toCurrency(fulfilledPrice - orderDict['total']) + '</em>&nbsp;滿額抽！';
        fulfilled.classList.remove('fulfilled');
    } else {
        fulfilled.classList.remove('fulfilled');
    }
    fulfilled.innerHTML = fulfilledText;
}

function dayAvailable() {
    var orders = document.querySelectorAll(".order");
    var d1Total = true;
    for (var i = 0; i < orders.length; i++) {
        var quantity = orders[i].parentNode.parentNode.querySelector('.quantity').value;
        var d1 = orders[i].parentNode.parentNode.querySelector('.d1').value;
        if (d1 * Math.abs(quantity) < 0) {
            d1Total = false;
            break;
        }
    }
    var d2Total = true;
    for (var i = 0; i < orders.length; i++) {
        var quantity = orders[i].parentNode.parentNode.querySelector('.quantity').value;
        var d2 = orders[i].parentNode.parentNode.querySelector('.d2').value;
        if (d2 * Math.abs(quantity) < 0) {
            d2Total = false;
            break;
        }
    }
    /*處理禁用選項的部分*/
    var dateBtns = document.querySelectorAll('.dateBtn');
    dateHandler(d1Total, dateBtns[0]);
    dateHandler(d2Total, dateBtns[1]);
    var dateConstraints = {
        date: {
            exclusion: {
                within: [],
                message: "^您所選購的商品當中\n含有無法在 %{value} 取貨的品項！",
            },
        }
    };
    var within = dateConstraints['date']['exclusion']['within'];
    if (d1Total == false) {
        within.push('2020-5-6 (三)');
    } else {
        if (within.indexOf('2020-5-6 (三)') != -1) {
            within.splice(within.indexOf('2020-5-6 (三)'));
        }
    }
    if (d2Total == false) {
        within.push('2020-5-7 (四)');
    } else {
        if (within.indexOf('2020-5-7 (四)') != -1) {
            within.splice(within.indexOf('2020-5-7 (四)'));
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

function vaild(item) {
    var form = document.querySelector('#form');
    status();
    dayAvailable();
    var errors = validate(form, constraints) || {};
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
}

//表單驗證區
function vaildListener(items) {
    (function() {
        // Hook up the form so we can prevent it from being posted
        var form = document.querySelector('#form');
        form.addEventListener("submit", function(ev) {
            ev.preventDefault();
            handleFormSubmit(form);
        });
        // Hook up the inputs to validate on the fly
        var inputs = document.querySelectorAll("input, textarea, select, .dec, .inc, .remove")
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
            var successMessage = "表單已完成。";
            var errorMessage = "表單內容有誤，請檢視錯誤訊息後重新輸入！";
            if (!errors) {
                doSuccess(successMessage);
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

        function doSuccess(message) {
            submitForm(items);
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
        el.parentNode.removeChild(el);
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
function clicked(item, items) {
    if (item.classList[0] == "click-able") {
        var quantity = item.parentNode.parentNode.querySelector('.quantity');
    } else {
        var quantity = document.querySelector('[name="quantity-' + item.name + '"]');
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
function submitForm(items) {
    // 表單驗證成功
    // contents of submitting
    var orderDict = status();
    // 驗證總金額是否為0
    if (orderDict['total'] <= 0) {
        alert("你似乎沒購買任何商品！");
        return;
    } else {
        if (!confirm("確定要結帳？")) {
            return;
        }
    }
    // show checkout alert
    alert('【結帳 Checkout】\n' + orderDict['outputText']);
    // prepare the post data
    var email = $('[name="email"]').val() || '未填寫';
    // confirm to post order
    if (!confirm("按下確定送出訂單\n確認信將會寄至：" + email)) {
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
    var total = orderDict['total'];
    // client info
    var now = moment(moment().valueOf()).format('YYYY-MM-DD HH:mm:ss');
    var href = window.location.href;
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
        "quantity": orderDict,
        "href": href,
    };
    var postData = dict;
    postData['method'] = "write";
    var jsonObj = [];
    jsonObj.push(dict);
    postData['jsonRaw'] = JSON.stringify(jsonObj);
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
            alert("確認信寄送失敗！請洽蘭友會粉絲專頁。");
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
            alert("確認信寄送失敗！請洽蘭友會粉絲專頁。");
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
        exclusion: {
        },
    },
};

function addProductConstraints(items) {
    for (var i = 0; i < items.length; i++) {
        var productConstraints = {
            presence: {
                message: "^您必須填寫此品項的購買數量！",
            },
            numericality: {
                onlyInteger: true,
                greaterThanOrEqualTo: 0,
                lessThanOrEqualTo: parseInt(items[i].upperLimit),
                notInteger: "^此品項購買數量只能是正整數！",
                notGreaterThanOrEqualTo: "^此品項購買數量只能是正整數！",
                notLessThanOrEqualTo: "^此品項購買數量已達本表單上限！如需訂購更多請直接向我們洽詢！",
            },
        };
        var productName = 'quantity-' + items[i].merchant + '-' + items[i].product;
        constraints[productName] = productConstraints;
    }
}

//千分位
function toCurrency(num) {
    var parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}
//set dep drop-down list
function setDepFragment(depList) {
    var setDepFragment = document.createDocumentFragment();
    for (var i = 0; i < depList.length; i++) {
        var depOpt = document.createElement("option");
        depOpt.value = depList[i].index.concat("-").concat(depList[i].department);
        depOpt.textContent = depList[i].department.concat(" (").concat(depList[i].index).concat(")");
        depOpt.disabled = depList[i].disabled;
        setDepFragment.appendChild(depOpt);
    }
    document.getElementById("department").appendChild(setDepFragment);
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

function createFixedElement() {
    var fixedContainer = document.querySelector(".fixed-container");
    var sectionProductsList = document.querySelectorAll('.sectionProductsList');
    var fixedSectionsList = document.querySelector("#fixedSectionsList");
    fixedSectionsList.innerHTML = '';
    var li = document.createElement("li");
    li.innerHTML = '<a class="bg" href="#info">買家基本資料</a>';
    fixedSectionsList.appendChild(li);
    for (var i = 0; i < sectionProductsList.length; i++) {
        var li = document.createElement("li");
        li.innerHTML = '<a class="bg" href="#' + sectionProductsList[i].id + '">' + sectionProductsList[i].id.substring(8) + '</a>';
        fixedSectionsList.appendChild(li);
    }
}

function addCartSection(items) {
    var section = document.createElement('section');
    section.id = 'cart';
    var p = document.createElement('p');
    p.className = 'title';
    p.innerHTML = '購物車';
    var table = document.createElement('table');
    table.id = 'cartTable';
    var tbody = document.createElement("tbody");
    tbody.innerHTML = '<tr id="tr-title"><th>商品</th><th>價格</th><th>數量</th><th>修改</th><th>小計</th></tr>';
    for (var i = 0; i < items.length; i++) {
        var order = items[i].merchant + '-' + items[i].product;
        var tr = document.createElement("tr");
        tr.id = 'tr-' + order;
        tr.innerHTML += '<td>' + order + '</td>';
        tr.innerHTML += '<td>$' + toCurrency(items[i].price) + '</td>';
        tr.innerHTML += '<td>' + 0 + '</td>';
        var td = document.createElement("td");
        var div = document.createElement("div");
        div.innerHTML += '<button type="button" class="cartBtn dec" name="' + order + '"><i class="fas fa-minus"></i></button>'
        div.innerHTML += '<button type="button" class="cartBtn inc" name="' + order + '"><i class="fas fa-plus"></i></button>'
        div.innerHTML += '<button type="button" class="cartBtn remove" name="' + order + '"><i class="fas fa-trash-alt"></i></button>'
        td.appendChild(div);
        tr.appendChild(td);
        tr.innerHTML += '<td>$' + toCurrency(0) + '</td>';
        tr.className = 'tr-hide'
        tbody.appendChild(tr);
    }
    tbody.innerHTML += '<tr id="tr-total"><td>總計</td><td></td><td></td><td></td><td>$' + toCurrency(0) + '</td></tr>';
    table.appendChild(tbody);
    section.appendChild(p);
    section.appendChild(table);
    section.appendChild(createSubmitButton());
    document.querySelector("form").appendChild(section);
}
//create submit button
function createSubmitButton() {
    var submit = document.createElement("button");
    submit.type = "submit";
    submit.id = "submit";
    submit.textContent = "結帳";
    submit.value = submit.textContent;
    return submit;
}
//Section of Merchant of product list
function addProductsList(items) {
    var productsList = document.createDocumentFragment();
    //resetFragment
    var productsFragment = document.createDocumentFragment();
    for (var i = 0; i < items.length; i++) {
        //addEachProduct
        productsFragment.appendChild(addEachProduct(items, i));
        if (i != items.length - 1) {
            if (items[i].merchant == items[i + 1].merchant) {
                continue;
            }
        }
        //addTitle
        var section = document.createElement("section");
        section.className = "sectionProductsList";
        section.id = "section-".concat(items[i].merchant);
        section.innerHTML = '<p class="title">'.concat(items[i].merchant).concat('</p>');
        //append
        section.appendChild(productsFragment);
        productsList.appendChild(section);
        //resetFragment
        var productsFragment = document.createDocumentFragment();
    }
    document.getElementById("form").appendChild(productsList);
}
//product list
function addEachProduct(items, index) {
    var inputMerchant = items[index].merchant;
    var inputPic = items[index].pic;
    var inputProduct = items[index].product;
    var inputLink = items[index].link;
    var inputPrice = items[index].price;
    var d1 = items[index].d1;
    var d2 = items[index].d2;
    var upperLimit = items[index].upperLimit;
    var productWholeName = inputMerchant.concat("-").concat(inputProduct);
    //container
    var container = document.createElement("div");
    container.className = "container";
    container.id = "container-".concat(inputMerchant).concat("-").concat(inputProduct);
    //pic
    container.innerHTML += '<div class="pic"><img src="' + inputPic + '"></div>'
    //products name with link
    container.innerHTML += '<div class="goods"><a href="' + inputLink + '" target="' + (inputLink != "#" ? '_blank' : '') + '">' + inputProduct + '</div>'
    //products price
    container.innerHTML += '<div class="price"><span class="priceText">' + toCurrency(inputPrice) + '</span></div>'
    //products quantity
    var orderContainer = document.createElement("div");
        orderContainer.className = "orderContainer";

    var meta = document.createElement("div");
        meta.className = "meta";
        meta.innerHTML += '<button class="d1' + (d1 < 0 ? ' disabled' : '') + '" type="" name="d1-' + productWholeName + '" value="' + d1 + '" disabled="disabled">5月6日<br>取貨</button>';
        meta.innerHTML += '<button class="d2' + (d2 < 0 ? ' disabled' : '') + '" type="" name="d2-' + productWholeName + '" value="' + d2 + '" disabled="disabled">5月7日<br>取貨</button>';
        meta.innerHTML += '<button class="upperLimit" type="" name="price-' + productWholeName + '" value="' + upperLimit + '" disabled="disabled">上限：' + upperLimit + '</button>';

    var order = document.createElement("div");
        order.className = "order";
        order.id = productWholeName;
        order.innerHTML += '<input class="priceValue" type="hidden" name="price-' + productWholeName + '" value="' + inputPrice + '">';
        //dec btn
        order.innerHTML += '<button type="button" class="click-able dec"><i class="fas fa-minus"></i></button>';
        //quantity input
        order.innerHTML += '<input class="quantity" type="number" name="quantity-' + productWholeName + '" value="0" min="0">';
        //inc btn
        order.innerHTML += '<button type="button" class="click-able inc"><i class="fas fa-plus"></i></button>';
        //remove btn
        order.innerHTML += '<button type="button" class="click-able remove"><i class="fas fa-trash-alt"></i></button>';
        
    orderContainer.appendChild(meta);
    orderContainer.appendChild(order);

    container.appendChild(orderContainer);
    container.innerHTML += '<div class="messages"></div>'
    return container;
}


    });
});