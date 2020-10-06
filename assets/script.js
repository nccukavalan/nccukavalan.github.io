document.addEventListener('DOMContentLoaded', main);
//global object
let activation = '';
let expiration = '';
let interval = null;
let title = '';
let titleText = '';
let intro = '';
let departmentDOM = '';
let radio = '';
let merchantsList = '';
let form = '';
let wrapper = '';
let timer = '';
let clickable = [];
let pickLocation = '';
let available = [];
let fulfilledPrice = [];
let w = [];
let d = [];
let m = [];
let p = [];
let member = [];
let coupon = [];
let total = 0;
let cart = [];
let cartInMerchant = [];
let appliedCoupon = {};
let orderStr = '';
let name = '';
let studentID = '';
let department = '';
let type = '';
let grade = '';
let phoneNumber = '';
let email = '';
let availableDate = '';
let period = '';
let couponID = '';
let upline = '';
let _isMember = false;
let _isGiveaway = false;
let _isCoupon = false;
let _isDiscount = false;
let errors = {};
const week = ['一', '二', '三', '四', '五', '六', '日'];
const typeObj = {
    'bachelor': '學士班',
    'master': '碩士班',
    'doctor': '博士班',
    'staff': '教職員工'
}
const gradeObj = {
    '1': '一年級',
    '2': '二年級',
    '3': '三年級',
    '4': '四年級',
    '5': '五年級',
    '6': '六年級',
    '7': '七年級',
    '-1': '教職員工'
}

function main() {
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
    
    if (window.location.href !== 'https://nccukavalan.github.io/') {
        console.log('External Execution!');
        //return;
    }
    //DOM selector
    title = document.querySelector('title');
    titleText = document.querySelector('h1');
    intro = document.querySelector('#intro');
    departmentDOM = document.querySelector('#department');
    radio = document.querySelector('.radio');
    merchantsList = document.querySelector("#merchantsList");
    form = document.querySelector('form');
    wrapper = document.querySelector('.wrapper');
    timer = document.querySelector('.timer');
    //initialize database
    firebase.initializeApp({
        databaseURL: "https://nccukvl.firebaseio.com/"
    });
    window.db = firebase.database();
    window.interval = window.setInterval(function() {
        if ((function(activation, expiration) {
            if (new Date().getTime() < activation) {
                let diff = (activation - new Date().getTime()) / 1000;
                timer.innerHTML = (diff / 86400 > 1 ? parseInt(diff / 86400) + '天' : '') + (diff / 3600 > 1 ? parseInt((diff % 86400) / 3600) + '時' : '') + (diff / 60 > 1 ? parseInt((diff % 3600) / 60) + '分' : '') + parseInt(diff % 60) + '秒';
                timer.innerHTML = w.beforeMessage.replace('%{text}', timer.innerHTML);
                if (document.querySelector('.noticeBox')) {
                    document.querySelector('.noticeBox').classList.add('hide');
                }
                return -1;
            } else if (new Date().getTime() > expiration) {
                let diff = (new Date().getTime() - expiration) / 1000;
                timer.innerHTML = (diff / 86400 > 1 ? parseInt(diff / 86400) + '天' : '') + (diff / 3600 > 1 ? parseInt((diff % 86400) / 3600) + '時' : '') + (diff / 60 > 1 ? parseInt((diff % 3600) / 60) + '分' : '') + parseInt(diff % 60) + '秒';
                timer.innerHTML = w.afterMessage.replace('%{text}', timer.innerHTML);
                if (document.querySelector('.noticeBox')) {
                    document.querySelector('.noticeBox').classList.add('hide');
                }
                return 1;
            }
            return 0;
        }
        )(activation, expiration) == 0) {
            if (document.querySelector('.noticeBox')) {
                document.querySelector('.noticeBox').classList.remove('hide');
            }
            timer.classList.add('hide');
            window.clearInterval(window.interval);
        }
    }, '1000');
    db.ref('/Setting/activity').on('value', function(e) {
        activation = new Date(e.val().activation).getTime();
        expiration = new Date(e.val().expiration).getTime();
    });
    db.ref('/Setting/webpage').once('value', function(e) {
        //get parameter
        w = e.val();
        //set DOM content
        title.innerHTML = w.title;
        titleText.innerHTML = w.title;
        titleText.innerHTML += '<span id="fulfilled"><br>你已消費&nbsp;$0</span>';
        titleText.innerHTML += '<span id="timer">｜載入中……</span>';
        intro.innerHTML = w.introduce;
        //notice
        const noticeBox = document.createElement('div');
        noticeBox.className = 'noticeBox';
        const noticeTitle = document.createElement('span');
        noticeTitle.className = 'noticeTitle';
        noticeTitle.innerHTML = '請先詳閱以下訂購須知';
        const noticeText = document.createElement('div');
        noticeText.className = 'noticeText init-notice';
        noticeText.innerHTML = w.announcement;
        const closeBtn = document.createElement('button');
        closeBtn.className = 'closeBtn';
        closeBtn.innerHTML = '我已閱讀並確認';
        noticeBox.appendChild(noticeTitle);
        noticeBox.appendChild(closeBtn);
        noticeBox.appendChild(noticeText);
        //timer.classList.add('hide')
        wrapper.appendChild(noticeBox);
        setInterval(function() {
            let diff = (expiration - new Date().getTime()) / 1000;
            let str = (diff / 86400 > 1 ? parseInt(diff / 86400) + '天' : '') + (diff / 3600 > 1 ? parseInt((diff % 86400) / 3600) + '時' : '') + (diff / 60 > 1 ? parseInt((diff % 3600) / 60) + '分' : '') + parseInt(diff % 60) + '秒';
            str = w.duringMessage.replace('%{text}', str);
            document.querySelector('#timer').innerHTML = ' ｜' + str;
            document.querySelector('.timer-fixed').innerHTML = str;
        }, 1000);
        document.querySelector('.closeBtn').addEventListener('click', function listener() {
            if (!(activation <= new Date().getTime() && new Date().getTime() <= expiration)) {
                this.innerHTML = '非開放時間';
                this.disabled = 'disabled';
                return;
            }
            wrapper.classList.add('hide');
            document.querySelector('.closeBtn').removeEventListener('click', listener);
        });
    });
    db.ref('/Setting/activity').once('value', function(e) {
        //get parameter
        const a = e.val();
        fulfilledPrice = a.fulfilled;
        //set DOM content
        available = a.available;
        const radioRow = document.createElement('div');
        radioRow.className = 'radioRow';
        for (let i = 0; i < available.length; i++) {
            for (let j = 0; j < available[i].period.length; j++) {
                const btn = document.createElement('button');
                let dateValue = new Date(available[i].date);
                btn.className = 'dateBtn';
                btn.type = 'button';
                btn.name = moment(dateValue).format('YYYY-MM-DD');
                btn.value = moment(dateValue).format('YYYY-MM-DD') + ' ' + available[i].period[j];
                btn.innerHTML = moment(dateValue).format('M[月]D[日]') + '（' + week[dateValue.getDay()] + '）' + available[i].period[j];
                radioRow.appendChild(btn);
                radio.appendChild(radioRow);
            }
        }
        document.querySelector('.radioRow').addEventListener('click', function(e) {
            let formGroup = (function f(node) {
                var node = node.parentNode;
                if (node.classList.contains("formRow")) {
                    return node;
                } else {
                    return f(node);
                }
            }
            )(this);
            if (formGroup.classList.contains('init')) {
                formGroup.classList.remove('init');
            }
            for (var i = 0; i < this.querySelectorAll('button.dateBtn').length; i++) {
                this.querySelectorAll('button.dateBtn')[i].classList.remove("active");
            }
            e.target.classList.add("active");
            document.querySelector('input[name="available"]').value = e.target.value.split(' ')[0];
            document.querySelector('input[name="period"]').value = e.target.value.split(' ')[1];
            status();
        });
        pickLocation = a.location;
    });
    db.ref('/Setting/mail').once('value', function(e) {
        //get parameter
        window.mailConfig = e.val();
    });
    db.ref('/Department').once('value', function(e) {
        d = e.val();
        for (let i = 0; i < d.length; i++) {
            let opt = document.createElement('option');
            opt.value = d[i].id;
            opt.textContent = d[i].name + ' (' + d[i].id + ')';
            departmentDOM.appendChild(opt);
        }
        $('.chosen-select').chosen({
            search_contains: true,
            width: '100%',
            no_results_text: "找不到",
            disable_search_threshold: 10,
        }).change(function() {
            document.querySelector('input[name="' + this.name + '"]').value = this.value;
            let formGroup = (function f(node) {
                var node = node.parentNode;
                if (node.classList.contains("formRow")) {
                    return node;
                } else {
                    return f(node);
                }
            }
            )(this);
            if (formGroup.classList.contains('init')) {
                formGroup.classList.remove('init');
            }
            status();
            //console.log(this, this.value);
            //console.log(document.querySelector('input[name="' + this.name + '"]').value);
        });
        document.querySelectorAll('.chosen-container').forEach(function(i) {
            i.addEventListener('click', function(e) {
                let formGroup = (function f(node) {
                    var node = node.parentNode;
                    if (node.classList.contains("formRow")) {
                        return node;
                    } else {
                        return f(node);
                    }
                }
                )(i);
                if (formGroup.classList.contains('init')) {
                    formGroup.classList.remove('init');
                }
                window.addEventListener('click', function listener(e) {
                    if (document.querySelectorAll('.chosen-with-drop').length == 0) {
                        status();
                        window.removeEventListener('click', listener);
                    }
                });
            });
        });
    });
    db.ref('/Merchant').once('value', function(e) {
        m = e.val();
        const li = document.createElement("li");
        li.innerHTML = '<a class="bg" href="#info">買家基本資料</a>';
        merchantsList.appendChild(li);
        const table = document.querySelector('#cartTable');
        for (let i = 1; i < m.length; i++) {
            //section
            const section = document.createElement('section');
            section.className = 'products init';
            section.id = 'merchant-' + m[i].id;
            section.innerHTML = '<p class="title">' + m[i].name + '</p>';
            section.innerHTML += '<div class="info">' + m[i].description + '</div>';
            form.insertBefore(section, document.querySelector('#cart'));
            //merchantsList
            const li = document.createElement("li");
            li.innerHTML = '<a class="bg" href="#' + section.id + '">' + m[i].name + '</a>';
            merchantsList.appendChild(li);
            //cart
            const tbody = document.createElement('tbody');
            tbody.id = 'merchant-' + m[i].id;
            tbody.classList.add('hide');
            let tr = '';
            tr = document.createElement("tr");
            tr.className = 'merchantTitle';
            tr.id = 'merchant-' + m[i].id;
            tr.innerHTML = '<th colspan="5">' + m[i].name + '</th>';
            tbody.appendChild(tr);
            tr = document.createElement("tr");
            tr.className = 'merchantDiscount hide';
            tr.id = 'merchant-' + m[i].id;
            tr.innerHTML = '<td>' + m[i].name + '折扣</td><td></td><td></td><td></td><td>$' + toCurrency(0) + '</td>';
            tbody.appendChild(tr);
            tr = document.createElement("tr");
            tr.className = 'merchantTotal';
            tr.id = 'merchant-' + m[i].id;
            tr.innerHTML = '<td>' + m[i].name + '總計</td><td></td><td></td><td></td><td>$' + toCurrency(0) + '</td>';
            tbody.appendChild(tr);
            table.insertBefore(tbody, document.querySelector('tfoot'));
        }
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
    });
    db.ref('/Product').once('value', function(e) {
        p = e.val();
        for (let i = 0; i < p.length; i++) {
            let section = document.querySelector('section#merchant-' + p[i].merchantID);
            let tbody = document.querySelector('tbody#merchant-' + p[i].merchantID);
            //product container
            var container = document.createElement('div');
            container.className = 'container';
            container.id = 'product-' + p[i].id;
            //picture
            container.innerHTML += '<div class="pic"><img src="' + p[i].picture + '"></div>'
            //products name with link
            container.innerHTML += '<div class="goods"><a href="' + p[i].link + '" target="' + (p[i].link != "#" ? '_blank' : '') + '">' + p[i].name.replace(/_/g, ' ') + '</div>'
            //products price
            container.innerHTML += '<div class="price"><span class="priceText">' + toCurrency(p[i].price.normal) + '</span></div>'
            //products quantity
            const orderContainer = document.createElement('div');
            orderContainer.className = 'orderContainer';
            let meta = document.createElement('div');
            meta.className = 'meta upper';
            for (let j = 0; j < available.length; j++) {
                meta.innerHTML += '<button class="available ' + (p[i].available[j] ? '' : 'disabled')/*+ '" name="product-' + p[i].id + '-' + j*/
                + '" name="' + moment(new Date(available[j].date)).format('YYYY-MM-DD') + '" value="' + (p[i].available[j] ? 0 : -1) + '" disabled="disabled">' + (p[i].available[j] ? '' : '<s>') + moment(new Date(available[j].date)).format('M[月]D[日]') + '<br>取貨' + (p[i].available[j] ? '' : '</s>') + '</button>';
            }
            orderContainer.appendChild(meta);
            meta = document.createElement('div');
            meta.className = 'meta';
            meta.innerHTML += '<button class="maximum" type="" id="maximum-' + p[i].id + '" name="maximum-' + p[i].id + '" value="' + p[i].maximum + '" disabled="disabled">上限：' + p[i].maximum + '</button>';
            meta.innerHTML += '<button class="amount" type="" id="amount-' + p[i].id + '" name="amount-' + p[i].id + '" value="' + p[i].amount + '" disabled="disabled">售出：' + p[i].amount + '</button>';
            orderContainer.appendChild(meta);
            const order = document.createElement('div');
            order.className = 'order';
            order.id = 'product-' + p[i].id;
            //order.innerHTML += '<input class="priceValue" type="hidden" name="price-' + p[i].id + '" value="' + p[i].price.normal + '">';
            //dec btn
            order.innerHTML += '<button type="button" class="clickable dec"><i class="fas fa-minus"></i></button>';
            //quantity input
            order.innerHTML += '<input class="quantity" type="number" name="quantity-' + p[i].id + '" value="0" min="0">';
            //inc btn
            order.innerHTML += '<button type="button" class="clickable inc"><i class="fas fa-plus"></i></button>';
            //remove btn
            order.innerHTML += '<button type="button" class="clickable remove"><i class="fas fa-trash-alt"></i></button>';
            orderContainer.appendChild(order);
            container.appendChild(orderContainer);
            container.innerHTML += '<div class="messages" id="messages-quantity-' + p[i].id + '"></div>'
            section.appendChild(container);
            //cart
            const tr = document.createElement("tr");
            tr.className = 'tr-product';
            tr.id = 'product-' + p[i].id;
            tr.innerHTML += '<td>' + p[i].name + '</td>';
            tr.innerHTML += '<td>$' + toCurrency(p[i].price.normal) + '</td>';
            tr.innerHTML += '<td>' + 0 + '</td>';
            const td = document.createElement('td');
            const div = document.createElement('div');
            div.innerHTML += '<button type="button" class="cartBtn dec" name="product-' + p[i].id + '"><i class="fas fa-minus"></i></button>'
            div.innerHTML += '<button type="button" class="cartBtn inc" name="product-' + p[i].id + '"><i class="fas fa-plus"></i></button>'
            div.innerHTML += '<button type="button" class="cartBtn remove" name="product-' + p[i].id + '"><i class="fas fa-trash-alt"></i></button>'
            td.appendChild(div);
            tr.appendChild(td);
            tr.innerHTML += '<td>$' + toCurrency(0) + '</td>';
            tr.classList.add('hide');
            tbody.insertBefore(tr, tbody.querySelector('.merchantDiscount'));
            constraints['quantity-' + p[i].id] = {
                presence: {
                    message: "^您必須填寫此品項的購買數量！",
                },
                numericality: {
                    onlyInteger: true,
                    greaterThanOrEqualTo: 0,
                    lessThanOrEqualTo: parseInt(p[i].maximum),
                    notInteger: "^此品項購買數量只能是正整數！",
                    notGreaterThanOrEqualTo: "^此品項購買數量只能是正整數！",
                    notLessThanOrEqualTo: "^此品項購買數量已達本表單上限！如需訂購更多請直接向我們洽詢！",
                },
            };
        }
        db.ref('/Product').on('value', function(e) {
            for (var i = 0; i < p.length; i++) {
                if (document.querySelector('.amount#amount-' + e.val()[i].id) != null) {
                    document.querySelector('.amount#amount-' + e.val()[i].id).innerHTML = '售出：' + e.val()[i].amount;
                }
            }
        });
        document.querySelectorAll('.clickable').forEach(function(i) {
            i.addEventListener('click', function() {
                clicked(this);
            });
        });
        document.querySelectorAll('.cartBtn').forEach(function(i) {
            i.addEventListener('click', function() {
                clicked(this);
            });
        });
        document.querySelectorAll('input.quantity').forEach(function(i) {
            i.addEventListener('input', function() {
                status();
            });
        });
    });
    db.ref('/Member').on('value', function(e) {
        member = e.val();
        $('[name="studentID"]').on('blur', function(e) {
            isFavourable(this, member);
        });
        $('[name="studentID"]').on('input', function(e) {
            isFavourable(this, member);
        });
    });
    db.ref('/Coupon').on('value', function(e) {
        coupon = e.val().filter(function(i) {
            return ((new Date(i.activation).getTime() <= new Date().getTime()) && (new Date(i.expiration).getTime() >= new Date().getTime()));
        });
        $('[name="coupon"]').on('blur', function(e) {
            isFavourable(this, coupon);
        });
        $('[name="coupon"]').on('input', function(e) {
            isFavourable(this, coupon);
        });
    });
    document.querySelector('button#checkout').addEventListener('click', function(e) {
        e.preventDefault();
        checkout();
    });
    document.querySelector('form#form').addEventListener('sumbit', function(e) {
        e.preventDefault();
    });
    document.querySelectorAll('.formRow.init input').forEach(function(i) {
        i.addEventListener('blur', function listener(e) {
            let formGroup = (function f(node) {
                var node = node.parentNode;
                if (node.classList.contains("formRow")) {
                    return node;
                } else {
                    return f(node);
                }
            }
            )(i);
            if (formGroup.classList.contains('init')) {
                formGroup.classList.remove('init');
            }
            i.removeEventListener('blur', listener);
        });
        i.addEventListener('input', function listener(e) {
            let formGroup = (function f(node) {
                var node = node.parentNode;
                if (node.classList.contains("formRow")) {
                    return node;
                } else {
                    return f(node);
                }
            }
            )(i);
            if (formGroup.classList.contains('init')) {
                formGroup.classList.remove('init');
            }
            i.removeEventListener('input', listener);
        });
        i.addEventListener('blur', function(e) {
            status();
        });
        i.addEventListener('input', function(e) {
            status();
        });
    });
    Object.defineProperties(window, {
        'isMember': {
            configurable: true,
            get: function() {
                return _isMember;
            },
            set: function(value) {
                //console.log('isMember: ', value);
                //status();
                _isMember = value;
            }
        },
        'isGiveaway': {
            configurable: true,
            get: function() {
                return _isGiveaway;
            },
            set: function(value) {
                //console.log('isGiveaway: ', value);
                //status();
                _isGiveaway = value;
            }
        },
        'isCoupon': {
            configurable: true,
            get: function() {
                return _isCoupon;
            },
            set: function(value) {
                //console.log('isCoupon: ', value);
                //status();
                _isCoupon = value;
            }
        },
        'isDiscount': {
            configurable: true,
            get: function() {
                return _isDiscount;
            },
            set: function(value) {
                //console.log('isCoupon: ', value);
                //status();
                _isDiscount = value;
            }
        }
    });
    window.constraints = {
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
                pattern: "(^((10[0-9]|9[0-9])([0-9z][0-9u][0-9])([0-9]{3})|([0-9]{6}))$)",
                message: "^您填寫的政大學號格式無效！\n（嘗試填寫此欄卻失敗者，請輸入6個9並立刻和我們聯絡，訂單方會成立）",
            }
        },
        department: {
            presence: {
                message: "^您必須填寫系所／單位！\n（無適當選項可選者，請選擇XXX並立刻和我們聯絡，訂單方會成立）",
            },
        },
        type: {
            presence: {
                message: "^您必須填寫學制／身分！\n（無適當選項可選者，請立刻和我們聯絡）",
            },
        },
        grade: {
            presence: {
                message: "^您必須填寫年級／身分！\n（無適當選項可選者，請立刻和我們聯絡）",
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
        available: {
            presence: {
                message: "^您必須填寫日期！\n難道你不來取貨嗎？",
            },
            exclusion: {
                within: [],
                message: "^您所選購的商品當中\n含有無法在 %{value} 取貨的品項！"
            },
        },
        coupon: {
            inclusion: {
                within: [],
                message: "",
            },
        },
        upline: {
            format: {
                pattern: "(^((10[0-9]|9[0-9])([0-9z][0-9u][0-9])([0-9]{3})|([0-9]{6}))$)",
                message: "^您填寫的政大學號格式無效！\n（嘗試填寫此欄卻失敗者，請輸入6個9並立刻和我們聯絡，訂單方會成立）",
            }
        },
    };
}

function isFavourable(item, list) {
    const n = item.name;
    const value = item.value;
    if (n == 'studentID') {
        isMember = (list.filter(function(i) {
            return i.id == value;
        }).length == 1) ? true : false;
    } else if (n == 'coupon') {
        let cl = list.filter(function(i) {
            return i.id == value;
        });
        isCoupon = (cl.length == 1) ? true : false;
        if (isCoupon) {
            appliedCoupon = cl[0];
        } else {
            appliedCoupon = {};
        }
    }
    status();
}

function status() {
    total = 0;
    cart = [];
    let availableArr = [];
    for (var i = 0; i < available.length; i++) {
        availableArr.push(0);
    }
    let containers = document.querySelectorAll('div.container');
    containers.forEach(function(container) {
        const id = parseInt(container.id.split('-')[1]);
        const priceText = container.querySelector('.priceText');
        priceText.innerHTML = (isMember ? p[id].price.member : p[id].price.normal);
        const q = parseInt(container.querySelector('.quantity').value);
        const productID = id;
        const merchantID = p[id].merchantID;
        const quantity = (q <= p[id].maximum ? q : p[id].maximum);
        const price = p[id].price;
        const subtotal = quantity * (isMember ? price.member : price.normal);
        if (quantity > 0) {
            cart.push({
                'productID': productID,
                'merchantID': merchantID,
                'quantity': quantity,
                'price': price
            });
            for (var i = 0; i < available.length; i++) {
                availableArr[i] += quantity * container.querySelectorAll('.available')[i].value;
            }
            document.querySelectorAll('section.products').forEach(function(i) {
                if (i.classList.contains('init')) {
                    i.classList.remove('init');
                }
            });
        }
        let tr = document.querySelector('tr#' + container.id);
        tr.childNodes[1].innerHTML = '$' + toCurrency((isMember ? price.member : price.normal));
        tr.childNodes[2].innerHTML = quantity;
        tr.childNodes[4].innerHTML = '$' + toCurrency(subtotal);
        if (subtotal > 0) {
            tr.classList.remove('hide');
        } else {
            tr.classList.add('hide');
        }
    });
    constraints.available.exclusion.within = [];
    for (var i = 0; i < available.length; i++) {
        document.querySelectorAll('.dateBtn[name="' + moment(new Date(available[i].date)).format('YYYY-MM-DD') + '"]').forEach(function(j) {
            j.disabled = '';
            if (availableArr[i] != 0) {
                j.disabled = 'disabled';
                if (constraints.available.exclusion.within.indexOf(moment(new Date(available[i].date)).format('YYYY-MM-DD')) == -1) {
                    constraints.available.exclusion.within.push(moment(new Date(available[i].date)).format('YYYY-MM-DD'));
                }
            }
        });
    }
    cartInMerchant = [];
    document.querySelectorAll('.merchantTotal').forEach(function(i) {
        const id = parseInt(i.id.split('-')[1]);
        let merchantTotal = 0;
        let filtered = cart.filter(function(item, index, array) {
            return item.merchantID == id;
        });
        //console.log(filtered);
        cartInMerchant.push(filtered);
        filtered.forEach(function(j) {
            merchantTotal += j.quantity * (isMember ? j.price.member : j.price.normal);
        });
        i.childNodes[4].innerHTML = '$' + toCurrency(merchantTotal);
        if (merchantTotal > 0) {
            i.parentNode.classList.remove('hide');
        } else {
            i.parentNode.classList.add('hide');
        }
    });
    cart.forEach(function(i) {
        total += (isMember ? i.price.member : i.price.normal) * i.quantity;
    });
    //console.log(cart);
    //console.log(total);
    //Discount - show
    const totalDiscountDOM = document.querySelector('#totalDiscount');
    totalDiscountDOM.querySelectorAll('td')[4].innerHTML = '$' + toCurrency(0);
    totalDiscountDOM.classList.add('hide');
    const merchantDiscountDOMs = document.querySelectorAll('.merchantDiscount');
    for (let i = 0; i < merchantDiscountDOMs.length; i++) {
        merchantDiscountDOMs[i].querySelectorAll('td')[4].innerHTML = '$' + toCurrency(0);
        merchantDiscountDOMs[i].classList.add('hide');
    }
    if (isMember) {
        constraints.coupon.inclusion.within = [];
        constraints.coupon.inclusion.message = "^會員優惠不得併用！";
    } else {
        constraints.coupon.inclusion.within = coupon.map(function(i) {
            return i.id
        });
        constraints.coupon.inclusion.message = "^無效的折扣代碼！";
    }
    //Discount - calculate
    isDiscount = false;
    if (isCoupon) {
        if (!isMember) {
            if (appliedCoupon.merchantID == 0) {
                if (total >= appliedCoupon.minimum) {
                    isDiscount = true;
                    total = total - appliedCoupon.amount;
                    totalDiscountDOM.querySelectorAll('td')[4].innerHTML = '$' + toCurrency(appliedCoupon.amount);
                    totalDiscountDOM.classList.remove('hide');
                }
            } else {
                merchantTotal = 0;
                cartInMerchant[appliedCoupon.merchantID - 1].forEach(function(i) {
                    merchantTotal += i.quantity * i.price.normal;
                });
                if (merchantTotal >= appliedCoupon.minimum) {
                    isDiscount = true;
                    merchantTotal = merchantTotal - appliedCoupon.amount;
                    total = total - appliedCoupon.amount;
                    merchantDiscountDOMs[appliedCoupon.merchantID - 1].querySelectorAll('td')[4].innerHTML = '$' + toCurrency(appliedCoupon.amount);
                    merchantDiscountDOMs[appliedCoupon.merchantID - 1].classList.remove('hide');
                    document.querySelector('.merchantTotal#merchant-' + appliedCoupon.merchantID).querySelectorAll('td')[4].innerHTML = '$' + toCurrency(merchantTotal);
                }
            }
        }
    }
    updateFixedElement();
    document.querySelector('tfoot').querySelector('#totalTotal').querySelectorAll('td')[4].innerHTML = '$' + toCurrency(total);
    //vaildate
    errors = validate(form, constraints) || {};
    //errors = {};
    if (Object.keys(errors).length == 0) {
        if (cart.length == 0) {
            document.querySelector('#checkout').innerHTML = '您未購物';
            document.querySelector('#checkout').disabled = 'disabled';
        } else {
            document.querySelector('#checkout').innerHTML = '結帳';
            document.querySelector('#checkout').disabled = '';
        }
    }
    let previous = '';
    //console.log(errors);
    form.querySelectorAll('input[name]').forEach(function(i) {
        let formGroup = (function f(node) {
            var node = node.parentNode;
            if (node.classList.contains("formRow") || node.classList.contains("container")) {
                return node;
            } else {
                return f(node);
            }
        }
        )(i);
        //IIFE
        if (previous == formGroup) {
            return;
        } else {
            previous = formGroup;
        }
        //console.log(formGroup);
        let messages = formGroup.querySelector('.messages#messages-' + i.name);
        //console.log(messages);
        formGroup.classList.remove("has-error");
        formGroup.classList.remove("has-success");
        formGroup.querySelectorAll(".help-block.error").forEach(function(j) {
            j.parentNode.removeChild(j);
        });
        //console.log(errors[i.name])
        if (!formGroup.classList.contains("init")) {
            if (errors[i.name]) {
                formGroup.classList.add('has-error');
                let block = document.createElement("p");
                block.classList.add("help-block");
                block.classList.add("error");
                block.innerHTML = errors[i.name][0];
                messages.appendChild(block);
            } else {
                if (formGroup.querySelectorAll(".help-block.error").length == 0) {
                    if (formGroup.classList.contains("container") && i.value <= 0) {
                        return;
                    }
                    formGroup.classList.add('has-success');
                    if (isMember && i.name == 'studentID') {
                        messages.innerHTML = '<p class="help-block error memberText">您為本會會員，享有優惠折扣！</p>';
                    }
                    if ((isCoupon && !isMember) && i.name == 'coupon') {
                        messages.innerHTML = '<p class="help-block error couponText">' + appliedCoupon.description + '</p>';
                    }
                }
            }
        }
    });
}

function updateFixedElement() {
    let bg = document.querySelector("a.bg");
    let products = document.querySelectorAll('section.products');
    if (cart.length > 0) {
        bg.classList.remove('zero');
        bg.classList.add('nonZero');
        for (let i = 0; i < products.length; i++) {
            products[i].classList.remove('zero');
        }
    } else {
        bg.classList.remove('nonZero');
        bg.classList.add('zero');
        for (let i = 0; i < products.length; i++) {
            if (!products[i].classList.contains('init')) {
                products[i].classList.add('zero');
            }
        }
    }
    let fulfilled = document.querySelector("#fulfilled");
    fulfilledText = '你已消費&nbsp;$' + toCurrency(total);
    if (total >= fulfilledPrice[0].amount) {
        if (total >= fulfilledPrice[fulfilledPrice.length - 1].amount) {
            fulfilledText += '，滿額任你抽！';
        } else {
            let fv = 0;
            let i = 0
            while (total >= fv) {
                fv = fulfilledPrice[i].amount;
                i++;
                if (i >= fulfilledPrice.length) {
                    break;
                }
                fv = fulfilledPrice[i].amount;
            }
            fulfilledText += '，再加&nbsp;<em>$' + toCurrency(fv - total) + '</em>&nbsp;加碼抽！';
        }
        fulfilled.classList.add('fulfilled');
    } else if (total > 0) {
        fulfilledText += '，再加&nbsp;<em>$' + toCurrency(fulfilledPrice[0].amount - total) + '</em>&nbsp;滿額抽！';
        fulfilled.classList.remove('fulfilled');
    } else {
        fulfilled.classList.remove('fulfilled');
    }
    document.querySelector("#totalFixed").innerHTML = fulfilledText;
    fulfilled.innerHTML = '<br>' + fulfilledText;
}

function checkout() {
    orderStr = ''
    document.querySelectorAll('.init').forEach(function(i) {
        i.classList.remove('init');
    })
    status();
    //console.log(errors)
    if (!(activation <= new Date().getTime() && new Date().getTime() <= expiration)) {
        document.querySelector('#checkout').innerHTML = '非開放時間';
        document.querySelector('#checkout').disabled = 'disabled';
        wrapper.classList.remove('hide');
        return;
    }
    if (Object.keys(errors).length > 0) {
        document.querySelector('#checkout').innerHTML = '請檢查表單';
        document.querySelector('#checkout').disabled = 'disabled';
        return;
    }
    if (cart.length == 0) {
        document.querySelector('#checkout').innerHTML = '您未購物';
        document.querySelector('#checkout').disabled = 'disabled';
        return;
    }
    //確認信-商品確認區
    for (let i = 0; i < cartInMerchant.length; i++) {
        if (cartInMerchant[i].length > 0) {
            orderStr += '<span style="font-weight: 1000;">';
            orderStr += m[i + 1].name;
            orderStr += '</span><br />';
            for (let j = 0; j < cartInMerchant[i].length; j++) {
                orderStr += '<span style="color: #F00; font-weight: 1000;">';
                orderStr += cartInMerchant[i][j].quantity;
                orderStr += '</span>';
                orderStr += '&nbsp;件';
                orderStr += '「';
                orderStr += '<span style="font-weight: 1000;">' + p[cartInMerchant[i][j].productID].name + '</span>' + '&nbsp;' + '($' + toCurrency((isMember ? p[cartInMerchant[i][j].productID].price.member : p[cartInMerchant[i][j].productID].price.normal)) + ')';
                orderStr += '」<br />';
            }
        }
    }
    orderStr += '<br />';
    if (Object.keys(appliedCoupon).length != 0) {
        if (isDiscount) {
            orderStr += '折扣代碼：<span style="color: #F00; font-weight: 1000;">' + appliedCoupon.id + '</span>' + '<br />' + '適用品項：<span style="color: #F00; font-weight: 1000;">' + m[appliedCoupon.merchantID].name + '</span>' + '<br />' + '折扣<span style="color: #F00; font-weight: 1000;">&nbsp;$' + toCurrency(appliedCoupon.amount) + '</span>' + '<br />' + '說明：<span style="color: #F00; font-weight: 1000;">' + appliedCoupon.description + '</span>' + '<br />';
        } else {
            orderStr += '請注意：<span style="color: #F00; font-weight: 1000;">' + m[appliedCoupon.merchantID].name + '</span>消費未達折扣門檻<span style="color: #F00; font-weight: 1000;">&nbsp;$' + toCurrency(appliedCoupon.minimum) + '</span>&nbsp;！' + '<br />';
        }
    }
    orderStr += '<p style="font-size: 1.5em;">' + '總金額為&nbsp;<span style="color: #F00; font-weight: 1000;">' + toCurrency(total) + '</span>&nbsp;元';
    if (total >= fulfilledPrice[0].amount) {
        let fv = 0;
        let i = 0;
        while (total >= fv) {
            fv = fulfilledPrice[i].amount;
            i++;
            if (i >= fulfilledPrice.length) {
                break;
            }
            fv = fulfilledPrice[i].amount;
        }
        orderStr += '<br /><span style="font-size:0.5em;">（恭喜獲得&nbsp;Lv.' + i + '&nbsp;滿額抽獎機會，祝您幸運中獎！）</span>';
    } else {
        orderStr += '<br /><span style="font-size:0.5em;">（再加&nbsp;$' + (fulfilledPrice[0].amount - total) + '&nbsp;就有滿額抽獎機會，繼續購物抽好禮！）</span>';
    }
    orderStr += '</p>';
    name = document.querySelector('input[name="name"]').value;
    studentID = document.querySelector('input[name="studentID"]').value;
    department = document.querySelector('input[name="department"]').value;
    type = document.querySelector('input[name="type"]').value;
    grade = document.querySelector('input[name="grade"]').value;
    phoneNumber = document.querySelector('input[name="phoneNumber"]').value;
    email = document.querySelector('input[name="email"]').value;
    availableDate = document.querySelector('input[name="available"]').value;
    period = document.querySelector('input[name="period"]').value;
    couponID = document.querySelector('input[name="coupon"]').value;
    upline = document.querySelector('input[name="upline"]').value;
    orderStr += '推薦人：' + upline;
    orderStr += '<br />';
    orderStr += '<p style="border-top: 1px #000 solid; border-bottom: 1px #000 solid; line-height:2em;">' + "以下為領取人（您）的聯絡資料" + '</p>' + '<p>' + (d.filter(function(i) {
        return i.id == department
    }).length == 1 ? d.filter(function(i) {
        return i.id == department
    })[0].name : '') + typeObj[type] + gradeObj[grade] + '<br />' + '<span style="color: #00F; font-weight: 1000; font-size: 1.5em;">' + name + '</span>' + '</p>' + '<p>' + '學號：<span style="font-weight: 1000;">' + studentID + '</span>' + '<br />' + '手機：<span style="font-weight: 1000;">' + phoneNumber + '</span>' + '<br />' + '信箱：<span style="font-weight: 1000;">' + email + '</span>' + '<br />' + '取貨日期：<span style="font-weight: 1000; background-color: #FF0;">' + moment(new Date(availableDate.replace(/-/g, '/'))).format('M[月]D[日]') + '（' + week[(new Date(availableDate.replace(/-/g, '/'))).getUTCDay()] + '）' + '</span>' + '<br />' + '取貨時間：<span style="font-weight: 1000; background-color: #FF0;">' + period + '</span>' + '<br />' + '取貨地點：<span style="font-weight: 1000; background-color: #FF0;">' + pickLocation + '</span>' + '<br />' + '（時間地點如有變更將在粉絲專頁公布）' + '</p>';
    //console.log('checkout');
    const noticeBox = document.querySelector('.noticeBox');
    noticeBox.classList.add('checkout');
    const noticeTitle = noticeBox.querySelector('.noticeTitle');
    noticeTitle.innerHTML = '購物清單';
    const noticeText = noticeBox.querySelector('.noticeText');
    noticeText.classList.remove('init-notice');
    noticeText.innerHTML = orderStr;
    const closeBtn = noticeBox.querySelector('.closeBtn');
    closeBtn.innerHTML = '繼續購物';
    closeBtn.classList.add('checkout');
    let submitBtn = '';
    if (noticeBox.querySelector('.submitBtn') === null) {
        submitBtn = document.createElement('button');
        submitBtn.className = 'submitBtn checkout';
        submitBtn.type = 'submit';
        submitBtn.innerHTML = '確認送出';
        noticeBox.appendChild(submitBtn);
    }
    submitBtn = noticeBox.querySelector('.submitBtn');
    wrapper.classList.remove('hide');
    document.querySelector('.closeBtn').addEventListener('click', function listener() {
        wrapper.classList.add('hide');
        this.removeEventListener('click', listener);
    });
    document.querySelector('button.submitBtn').addEventListener('click', function listener(e) {
        e.preventDefault();
        submit();
        document.querySelector('button.submitBtn').removeEventListener('click', listener);
    });
}

function submit() {
    //console.log('submit');
    timer.innerHTML = '訂單送出中，確認信將寄至&nbsp;' + email;
    document.querySelector('.noticeBox').classList.add('hide');
    timer.classList.remove('hide');
    let orderID = (function randomID(len) {
        var chars = 'abcdefhijkmnprstwxyz';
        var maxPos = chars.length;
        var str = '';
        for (i = 0; i < len; i++) {
            str += chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return str;
    }
    )(4) + (new Date().getTime());
    let customerObj = {};
    customerObj.id = studentID;
    customerObj.name = name;
    customerObj.departmentID = department;
    customerObj.grade = grade;
    customerObj.phoneNumber = phoneNumber;
    customerObj.email = email;
    customerObj.type = {
        'bachelor': (type == 'bachelor' ? true : false),
        'master': (type == 'master' ? true : false),
        'doctor': (type == 'doctor' ? true : false),
        'staff': (type == 'staff' ? true : false)
    }
    let orderObj = {};
    orderObj.id = orderID;
    orderObj.studentID = studentID;
    orderObj.available = availableDate;
    orderObj.period = period;
    orderObj.couponID = (isCoupon ? appliedCoupon.id : '');
    orderObj.isGiveaway = (isGiveaway ? true : false);
    orderObj.discount = {
        'merchantID': (isCoupon ? appliedCoupon.merchantID : ''),
        'quantity': (isCoupon ? appliedCoupon.amount : '')
    };
    orderObj.upline = upline;
    orderObj.total = total;
    orderObj.timestamp = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    orderObj.source = window.location.href;
    orderObj.status = {
        'cancelled': false,
        'locked': false,
        'paid': false,
        'picked': false,
    }
    cart.map(function(i) {
        delete i.merchantID;
        delete i.price;
        i.orderID = orderID
    });
    orderStr = '<div style="margin:1em; padding:1em; background-color: #FFD;">' + '<p>' + (d.filter(function(i) {
        return i.id == department
    }).length == 1 ? d.filter(function(i) {
        return i.id == department
    })[0].name : '') + typeObj[type] + gradeObj[grade] + '<br />' + '<span style="color: #00F; font-weight: 1000; font-size: 1.5em;">' + name + '</span>' + '</p>' + '<p style="border-top: 1px #000 solid; border-bottom: 1px #000 solid; line-height: 2em;">' + '您在本次蘭陽週預購之商品訂單如下' + '</p>' + orderStr + '<p style="border-bottom: 1px #000 solid; line-height:2em;">' + '</p>' + '<p style="font-size: 0.75em;">' + mailConfig.notice + '</p>' + '<p style="font-size: 1em;">' + '蘭陽週團隊感謝您訂購' + '</p>' + '<p style="border-bottom: 1px #000 solid; line-height:2em;">' + '</p>' + '<p>' + mailConfig.signature + '</p>' + '<p style="border-bottom: 1px #000 solid; line-height:2em;">' + '</p>' + '<p style="font-size: 0.75em; font-weight: 1000;">' + '訂單編號：' + orderID + '<br />' + '您的訂單已於&nbsp;' + orderObj.timestamp + '&nbsp;送出' + '</p>' + '</div>';
    db.ref('/Customer/').push(customerObj);
    db.ref('/Order/').push(orderObj);
    for (var i = 0; i < cart.length; i++) {
        db.ref('/Cart/').push(cart[i]);
    }
    $.ajax({
        type: "post",
        data: {},
        url: "https://script.google.com/macros/s/AKfycbxnyiaThCdR0x4yzvXqSUzHAHxrNLGLyVkNLMniHqjP8URoiOU/exec",
        // 填入網路應用程式網址
        success: function(e) {
            alert(e);
        }
    });
    let mailObj = {
        Host: mailConfig.host,
        Username: mailConfig.username,
        Password: mailConfig.password,
        To: email,
        From: mailConfig.from,
        Subject: mailConfig.subjectForClient,
        Body: orderStr
    };
    //console.log(orderStr)
    //console.log(mailObj.Body)
    Email.send(mailObj).then(function(message) {
        if (message != "OK") {
            alert("確認信寄送失敗！請速洽本會粉絲專頁。");
        } else {
            alert("訂單已送出！確認信已寄至您的電子郵件信箱！");
        }
    });
    mailObj.To = mailConfig.username;
    mailObj.Subject = mailConfig.subjectForServer;
    mailObj.Body = '<p style="border-top: 1px #000 solid; border-bottom: 1px #000 solid; line-height:2em;">' + '⚠️以下是&nbsp;' + name + '&nbsp;的消費紀錄⚠️' + '</p>' + orderStr;
    Email.send(mailObj).then(function(message) {
        if (message != "OK") {
            alert("確認信寄送失敗！請速洽本會粉絲專頁。");
        } else {
            $('[href="assets/style.css"]').removeAttr("href");
            var body = document.querySelector('body')
            body.innerHTML = orderStr;
            $(document).off('click');
        }
    });
}

function clicked(item) {
    //console.log(item);
    let container = '';
    if (item.classList.contains('clickable')) {
        container = item.parentNode.parentNode;
    } else if (item.classList.contains('cartBtn')) {
        container = document.querySelector('.container#' + item.name);
    }
    let quantity = container.querySelector('.quantity');
    let maximum = parseInt(container.querySelector('.maximum').value);
    if (item.classList.contains('inc')) {
        if (parseInt(quantity.value) < 0 || quantity.value == '') {
            quantity.value = 1;
        } else if (parseInt(quantity.value) >= maximum) {
            quantity.value = maximum;
        } else {
            quantity.value = parseInt(quantity.value) + 1;
        }
    }
    if (item.classList.contains('dec')) {
        if (parseInt(quantity.value) >= 1) {
            if (parseInt(quantity.value) >= (maximum + 1)) {
                quantity.value = maximum;
            } else {
                quantity.value = parseInt(quantity.value) - 1;
            }
        } else if (quantity.value == '' || parseInt(quantity.value) < 0) {
            quantity.value = 0;
        }
    }
    if (item.classList.contains('remove')) {
        quantity.value = 0;
    }
    status();
}

function toCurrency(num) {
    var parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}
