// create the the drop-down list
$(function() {
    //load the drop-down list
    $.get("https://spreadsheets.google.com/feeds/list/13Sd4GBenMwijWjADGO_loLWk8sXf5_BACam5mGzd878/1/public/values?alt=json", function(data) {
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
        setDepFragment(depList);
        //load chosen.jquery when the drop-down list were done
        loadSelectChosen();
    });

    //create product list and items set
    $.get("https://spreadsheets.google.com/feeds/list/115PPsgx0--jvrpV-JIekfH5IR-JbKCNuCDXbYODslVk/1/public/values?alt=json", function(data) {
        var d = data.feed.entry;
        var items = [];
        for (var i in d) {
            var item = {};
            item.merchant = d[i].gsx$merchant.$t;
            item.product = d[i].gsx$product.$t;
            item.price = d[i].gsx$price.$t;
            item.link = d[i].gsx$link.$t;
            item.pic = d[i].gsx$pic.$t;
            items.push(item);
        }
        //console.table(items);

        //add the element
        addProductsList(items);
        createFixedElement();
        vaild(items);

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
    });
});

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
        li.innerHTML = '<a class="bg" href="#info" style="background-color:#EEE">買家基本資料</a>';
    fixedSectionsList.appendChild(li);

    for (var i = 0; i < sectionProductsList.length; i++) {
            var li = document.createElement("li");
                li.innerHTML = '<a class="bg" href="#'+ sectionProductsList[i].id +'" style="background-color:#EEE">' + sectionProductsList[i].id.substring(8) + '</a>';
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
                td.innerHTML += '<button type="button" class="cartBtn dec" name="' + order + '"><i class="fas fa-minus"></i></button>'
                td.innerHTML += '<button type="button" class="cartBtn inc" name="' + order + '"><i class="fas fa-plus"></i></button>'
                td.innerHTML += '<button type="button" class="cartBtn remove" name="' + order + '"><i class="fas fa-trash-alt"></i></button>'
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
    submit.textContent = "送出".concat("!!測試中-之後移到最下面!!");
    submit.value = submit.textContent;
    return submit;
}

//即時消費情形
function status() {

    var orders = document.querySelectorAll(".order")
    var total = 0;

    var output = "";
    var orderDict = {};

    for (var i = 0; i < orders.length; i++) {

        var productName = orders[i].id;
        var price = orders[i].childNodes[0].value;
        var quantity = orders[i].childNodes[2].value;
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

    updateFixedElement(orderDict);

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

function updateFixedElement(orderDict) {
    var bg = document.querySelector(".bg");
    var sectionProductsList = document.querySelectorAll('.sectionProductsList');

    var fixed = document.querySelector("#fixed");
        fixed.textContent = '$' + toCurrency(orderDict['total']);

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
}

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
            if ($(this).prop('checked') === true)
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
    alert("訂單已送出！確認信已寄至您的電子郵件信箱！");

    $('[href="assets/style.css"]').removeAttr("href");
    var mailBody = sendMail(dict);
    var body = document.querySelector('body')
    body.innerHTML = mailBody;
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
    mailBody += '以上資訊為本表單系統自動填入<br />';
    mailBody += '訂單概以後台紀錄為準<br />';
    mailBody += '若同學有發現錯誤歡迎回信或私訊粉專告知<br />';
    mailBody += '⚠️當天若有同學忘記取貨，會有友會人員電話通知<br />';
    mailBody += '⚠️欲變更或取消訂單請在預購截止前向我們聯絡，如有惡意棄單將公告於交流版<br />';
    mailBody += '</p>';

    mailBody += '<p style="font-size: 1em;">';
    mailBody += '蘭陽週團隊感謝您訂購'
    mailBody += '</p>';

    mailBody += '<p style="border-bottom: 1px #000 solid; line-height:2em;">';
    mailBody += '</p>';

    mailBody += '<p>';
    mailBody += '國立政治大學蘭友會<br />';
    mailBody += '地址｜台北市文山區指南路二段64號<br />';
    mailBody += '信箱｜nccukavalan2.0@gmail.com<br />';
    mailBody += '粉專｜fb.me/nccukavalan';
    mailBody += '</p>';

    mailBody += '<p style="border-bottom: 1px #000 solid; line-height:2em;">';
    mailBody += '</p>';

    mailBody += '<p style="font-size: 0.75em;">';
    mailBody += '您的訂單已於&nbsp;' + dict['timestamp'] + '&nbsp;送出';
    mailBody += '</p>';

    mailBody += '</div>';

    Email.send({
        Host: "smtp.gmail.com",
        Username: "nccukavalan2.0@gmail.com",
        Password: "qvygrpxtuogyhruk",
        To: dict['email'],
        //email
        From: "nccukavalan2.0@gmail.com",
        Subject: "⚠️⚠️重要通知⚠️⚠️蘭陽週商品確認信及取貨通知",
        Body: mailBody,
    }).then(message=>{
        var msg = message;
        if (msg != "OK") {
            alert("確認信寄送失敗！請洽蘭友會人員處理");
        }
    });

    mailBodyCopy = '<p style="border-top: 1px #000 solid; border-bottom: 1px #000 solid; line-height:2em;">';
    mailBodyCopy += '⚠️以下是&nbsp;' + dict['name'] + '&nbsp;的消費紀錄⚠️';
    mailBodyCopy += '</p>';
    mailBodyCopy += mailBody;

    Email.send({
        Host: "smtp.gmail.com",
        Username: "nccukavalan2.0@gmail.com",
        Password: "qvygrpxtuogyhruk",
        To: "nccukavalan2.0@gmail.com",
        //email
        From: "nccukavalan2.0@gmail.com",
        Subject: "有人前來光顧蘭陽週預購了！",
        Body: mailBodyCopy,
    }).then(message=>{
        var msg = message;
        if (msg != "OK") {
            alert("確認信寄送失敗！請洽蘭友會人員處理");
        }
    });

    return mailBody;
}

//表單驗證資訊
function setValidateConstraints(items) {
    // These are the constraints used to validate the form
    // 未使用或不欲驗證之欄位請務必從下列項目中註解化或移除
    var constraints = {
        name: {
            presence: {
                message: "不能留空！\n難道你是無名氏逆？",
            },
            format: {
                pattern: "^([A-Za-z ,-]|[\u4E00-\u9FFF．]|[^\x00-\xFF]])+$",
                message: "的輸入格式無效！\n你的名字沒這麼奇怪吧？（如果這確實是你的真名，請立刻和我們聯絡）",
            }
        },
        studentID: {
            presence: {
                message: "不能留空！",
            },
            format: {
                pattern: "(^10[0-8][0-9]{6}$|^999999999$)",
                message: "的輸入格式無效！\n（嘗試填寫此欄卻失敗者，請輸入9個9並立刻和我們聯絡，訂單方會成立）",
            }
        },
        department: {
            presence: {
                message: "不能留空！\n（無適當選項可選者，請選擇XXX並立刻和我們聯絡，訂單方會成立）",
            },
        },
        grade: {
            presence: {
                message: "不能留空！\n（無適當選項可選者，請立刻和我們聯絡）",
            },
        },
        phoneNumber: {
            presence: {
                message: "不能留空！\n我們需要和你聯絡及確認訂單！",
            },
            format: {
                pattern: "^09[0-9]{8}$",
                message: "欄位請輸入臺灣的手機門號，無需加入符號",
            }
        },
        email: {
            presence: {
                message: "不能留空！\n我們需要和你聯絡及確認訂單！",
            },
            email: {
                message: "的輸入格式無效！",
            },
        },
        date: {
            presence: {
                message: "不能留空！難道你不來取貨嗎？",
            },
        },
    };

    for (var i = 0; i < items.length; i++) {
        productName = "quantity-".concat(items[i].merchant).concat("-").concat(items[i].product);
        constraints[productName] = {
            presence: {
                message: "的訂購數量不能留空！",
            },
            numericality: {
                onlyInteger: true,
                greaterThanOrEqualTo: 0,
                lessThanOrEqualTo: 20,
                notInteger: "的訂購數量只能是整數！",
                notGreaterThanOrEqualTo: "的訂購數量不能為負！",
                notLessThanOrEqualTo: "的訂購數量已達本表單上限！如需要訂購更多請直接向我們洽詢！",
            },
        }
    }

    //停用驗證
    //constraints = {};

    return constraints;
}

//表單驗證區
function vaild(items) {
    (function() {
        // Hook up the form so we can prevent it from being posted
        var formIdName = "#form";
        var form = document.querySelector(formIdName);

        form.addEventListener("submit", function(ev) {
            ev.preventDefault();
            handleFormSubmit(form);
        });

        // Hook up the inputs to validate on the fly
        var inputs = document.querySelectorAll("input, textarea, select, .dec, .inc, .remove")
        for (var i = 0; i < inputs.length; ++i) {
            inputs.item(i).addEventListener("change", function(ev) {
                var errors = validate(form, setValidateConstraints(items)) || {};
                showIsErrorsForInput(this, errors[this.name]);
                status();
            });
            inputs.item(i).addEventListener("input", function(ev) {
                var errors = validate(form, setValidateConstraints(items)) || {};
                showIsErrorsForInput(this, errors[this.name]);
                status();
            });
            inputs.item(i).addEventListener("blur", function(ev) {
                var errors = validate(form, setValidateConstraints(items)) || {};
                showIsErrorsForInput(this, errors[this.name]);
                status();
            });
            inputs.item(i).addEventListener("click", function(ev) {
                var errors = validate(form, setValidateConstraints(items)) || {};
                showIsErrorsForInput(this, errors[this.name]);
                status();
            });
            $(".chosen-select").change(function(ev) {
                var errors = validate(form, setValidateConstraints(items)) || {};
                showIsErrorsForInput(this, errors[this.name]);
            });
        }

        function handleFormSubmit(form) {
            // validate the form against the constraints
            var errors = validate(form, setValidateConstraints(items));
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
            alert(message);
        }

        function doSuccess(message) {
            submitForm(items);
        }

    }
    )();
    //最後的括號是必要且不可刪除的
    /*
    * validate.js end
    * 表單驗證區結束
    */
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

// Shows the errors for a specific input
function showIsErrorsForInput(input, errors) {

    var messagesClassName = ".messages";

    // This is the root of the input
    var formGroup = findParentNode(input);

    function findParentNode(node) {
        var node = node.parentNode;
        if (node.classList.contains("formRow") || node.classList.contains("container")) {
            return node;
        } else {
            return findParentNode(node);
        }
    }

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

//千分位
function toCurrency(num) {
    var parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

//when the count input was clicked
function clicked(item, items) {
    if (item.classList[0] == "click-able") {
        var quantity = item.parentElement.childNodes[2];
    } else {
        var quantity = document.querySelector('[name="quantity-' + item.name + '"]');
    }

    //onclick
    if (item.classList[1] == "inc") {
        if (parseInt(quantity.value) < 0) {
            quantity.value = 1;
        } else if (parseInt(quantity.value) >= 21) {
            quantity.value = 21;
        } else if (quantity.value == "") {
            quantity.value = 1;
        } else {
            quantity.value = parseInt(quantity.value) + 1;
        }
        status();
    }
    if (item.classList[1] == "dec") {
        if (parseInt(quantity.value) >= 1) {
            quantity.value = parseInt(quantity.value) - 1;
        } else if (quantity.value == "" || parseInt(quantity.value) < 0) {
            quantity.value = 0;
        }
        status();
    }
    if (item.classList[1] == "remove") {
        quantity.value = 0;
        status();
    }

    item.addEventListener("click", function(ev) {
        var errors = validate(form, setValidateConstraints(items)) || {};
        showIsErrorsForInput(quantity, errors['quantity-' + quantity.parentNode.id]);
        status();
    });

    item.addEventListener("focus", function(ev) {
        var errors = validate(form, setValidateConstraints(items)) || {};
        showIsErrorsForInput(quantity, errors['quantity-' + quantity.parentNode.id]);
        status();
    });

    item.addEventListener("blur", function(ev) {
        var errors = validate(form, setValidateConstraints(items)) || {};
        showIsErrorsForInput(quantity, errors['quantity-' + quantity.parentNode.id]);
        status();
    });
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
    var order = document.createElement("div");
    order.className = "order";
    order.id = productWholeName;
    //quantity input
    order.innerHTML += '<input class="priceValue" type="hidden" name="price-' + productWholeName + '" value="' + inputPrice + '">';

    //dec btn
    order.innerHTML += '<button type="button" class="click-able dec"><i class="fas fa-minus"></i></button>';

    //quantity input
    order.innerHTML += '<input class="quantity" type="number" name="quantity-' + productWholeName + '" value="0" min="0">';

    //inc btn
    order.innerHTML += '<button type="button" class="click-able inc"><i class="fas fa-plus"></i></button>';

    //remove btn
    order.innerHTML += '<button type="button" class="click-able remove"><i class="fas fa-trash-alt"></i></button>';

    container.appendChild(order);

    container.innerHTML += '<div class="messages"></div>'

    return container;
}