var BUTTON_SERVICE = 'FFE0';
var DATA_CHARACTERISTIC = 'FFE1';

var app = {
    initialize: function() {
        this.bindEvents();
        this.showMainPage();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('backbutton', this.onBackButton, false);
        deviceList.addEventListener('click', this.connect, false);
        refreshButton.addEventListener('click', this.refreshDeviceList, false);
        disconnectButton.addEventListener('click', this.disconnect, false);
    },
    onDeviceReady: function() {
        FastClick.attach(document.body); // https://github.com/ftlabs/fastclick
        app.refreshDeviceList();
    },
    refreshDeviceList: function() {
        deviceList.innerHTML = ''; // empty the list
        ble.scan(['AA80'], 5, app.onDiscoverDevice, app.onError);
    },
    onDiscoverDevice: function(device) {
        var listItem = document.createElement('li');
        listItem.innerHTML = device.name + '<br/>' +
            device.id + '<br/>' +
            'RSSI: ' + device.rssi;
        listItem.dataset.deviceId = device.id;
        deviceList.appendChild(listItem);
    },
    connect: function(e) {
        var deviceId = e.target.dataset.deviceId;
        ble.connect(deviceId, app.onConnect, app.onError);
    },
    onConnect: function(peripheral) {
        app.peripheral = peripheral;
        app.showDetailPage();

        // subscribe to be notified when the button state changes
        ble.startNotification(
            peripheral.id,
            BUTTON_SERVICE,
            DATA_CHARACTERISTIC,
            app.onNotification,
            app.onError
        );
    },
    onNotification: function(buffer) {
        console.log('onNotification');
        var data = new Uint8Array(buffer);
        var state = data[0];
        console.log(state);

        // bitmask
        var LEFT_BUTTON = 1;  // 0001
        var RIGHT_BUTTON = 2; // 0010
        var REED_SWITCH = 4;  // 0100

        var message = '';

        if (state === 0) {
            message = 'No buttons are pressed.';
        }

        if (state & LEFT_BUTTON) {
            message += 'Left button is pressed.<br/>';
        }

        if (state & RIGHT_BUTTON) {
            message += 'Right button is pressed.<br/>';
        }

        if (state & REED_SWITCH) {
            message += 'Reed switch is activated.<br/>';
        }

        statusDiv.innerHTML = message;
    },
    disconnect: function(e) {
        if (app.peripheral && app.peripheral.id) {
            ble.disconnect(app.peripheral.id, app.showMainPage, app.onError);
        }
    },
    showMainPage: function() {
        mainPage.hidden = false;
        detailPage.hidden = true;
    },
    showDetailPage: function() {
        mainPage.hidden = true;
        detailPage.hidden = false;
    },
    onBackButton: function() {
        if (mainPage.hidden) {
            app.disconnect();
        } else {
            navigator.app.exitApp();
        }
    },
    onError: function(reason) {
        navigator.notification.alert(reason, app.showMainPage, 'Error');
    }
};

app.initialize();
