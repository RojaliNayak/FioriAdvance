sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/models",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/CreateVerify/models",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/METWorklist/models",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/Worklist/models",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/CreateVerify/ListSelector",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/CreateVerify/ErrorHandler",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/m/MessageBox"
], function (UIComponent, Device, models, modelsCreate, modelsMET, modelsWorklist, ListSelector, ErrorHandler, JSONModel, Filter, MessageBox) {
	"use strict";

	return UIComponent.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.Component", {

		metadata: {
			manifest: "json",
			includes: ["css/style.css","css/CageAudit/rtv_NewCageAuditStyle.css","css/METWorklist/style.css","css/Worklist/style.css",
			"css/Buyback/rtvBuybackStyle.css", "css/CageReport/style.css", "css/CreateVerify/style"]
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			if (sap.ushell && sap.ushell.Container) {
				//GOOGLE ANALYTICS INTEGRATION
				this.logonSystemName = sap.ushell.Container.getLogonSystem().getName(); //"DG0";//
				this.googleAnalyticsTrackingId = 'UA-88381745-10';
				if (this.logonSystemName === "DG0") {
					this.googleAnalyticsTrackingId = 'UA-88381745-10';
				} else if (this.logonSystemName === "QG0") {
					this.googleAnalyticsTrackingId = 'UA-88381745-15';
				} else if ((this.logonSystemName === "PG0") || (this.logonSystemName === "PG1")) {
					this.googleAnalyticsTrackingId = 'UA-88381745-16';
				}

				(function (i, s, o, g, r, a, m) {
					i['GoogleAnalyticsObject'] = r;
					i[r] = i[r] || function () {
							(i[r].q = i[r].q || []).push(arguments)
						},
						i[r].l = 1 * new Date();
					a = s.createElement(o),
						m = s.getElementsByTagName(o)[0];
					a.async = 1;
					a.src = g;
					m.parentNode.insertBefore(a, m)
				})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

				ga('create', this.googleAnalyticsTrackingId, 'auto');
				//END GOOGLE ANALYTICS INTEGRATION
			}

			if (window.datawedge) {
				window.datawedge.registerForBarcode(function (oData) {
					var focusedControlId = sap.ui.getCore().getCurrentFocusedControlId();

					if (focusedControlId) {
						var oFocusedControl = sap.ui.getCore().byId(focusedControlId);

						if (oFocusedControl && $.isFunction(oFocusedControl.setValue)) {
							oFocusedControl.setValue(oData.barcode);
						}

						if (oFocusedControl && $.isFunction(oFocusedControl.fireSearch)) {
							oFocusedControl.fireSearch({
								query: oData.barcode,
								refreshButtonPressed: false
							});
						} else if (oFocusedControl && $.isFunction(oFocusedControl.fireChangeEvent)) {
							oFocusedControl.fireChangeEvent(oData.barcode);
						}
					}
					oFocusedControl._$input.blur();
				});
			}
			
			// set Auth model
			var oAuthModel = new JSONModel();
			this.setModel(oAuthModel, "oAuthModel");
		},

		myNavBack: function () {
			var oHistory = History.getInstance();
			var oPrevHash = oHistory.getPreviousHash();
			if (oPrevHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("masterSettings", {}, true);
			}
		},

		getContentDensityClass: function () {
			if (!this._sContentDensityClass) {
				if (!sap.ui.Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},
		
		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Worklist ~~~~~~~~~~~~~~~~~~~
		
		Worklist: function () {
			
			// call the base component's init function
			//UIComponent.prototype.init.apply(this, arguments);

			// initialize the error handler with the component
			this._oErrorHandler = new ErrorHandler(this);

			// set device model
			var oDeviceModel = new JSONModel(Device);
			oDeviceModel.setDefaultBindingMode("OneWay");
			this.setModel(oDeviceModel, "device");

			var vendorModel = new JSONModel({
				VendorList: [],
				Count: {
					VENDOR_NUM: 0,
					VENDOR_DEN: 0
				}
			});
			this.setModel(vendorModel, "VendorModel");
			vendorModel.setSizeLimit(1000);

			var vendorWorklistModel = new JSONModel();
			this.setModel(vendorWorklistModel, "VendorWorklistModel");

			var vendorAddressModel = new JSONModel({
				VendorAddress: []
			});
			this.setModel(vendorAddressModel, "VendorAddressModel");

			//Model to store rows with STATUS 300 & 310.
			var worksheetModel = new JSONModel();
			this.setModel(worksheetModel, "worksheetModel");
			worksheetModel.setSizeLimit(1000);

			var odataWorklistmodel = new JSONModel();
			this.setModel(odataWorklistmodel, "odataWorklistmodel");
			odataWorklistmodel.setSizeLimit(1000);

			var oSearchModel = new JSONModel();
			this.setModel(oSearchModel, "oSearchModel");

			// set Auth model
			var oAuthModel = new JSONModel();
			this.setModel(oAuthModel, "oAuthModel");

			// set Email Domin Parameter model
			var oEmailDomain = new JSONModel();
			this.setModel(oEmailDomain, "oEmailDomain");

			// this.getModel("labelModel").setUseBatch(false);
			// this.getModel("labelModel").setSizeLimit(1000);

			// create the views based on the url/hash
			this.getRouter().initialize();

			this._message = null;

			if (window.datawedge) {
				window.datawedge.registerForBarcode(function (oData) {
					var focusedControlId = sap.ui.getCore().getCurrentFocusedControlId();

					if (focusedControlId) {
						var oFocusedControl = sap.ui.getCore().byId(focusedControlId);

						if (oFocusedControl && $.isFunction(oFocusedControl.setValue)) {
							oFocusedControl.setValue(oData.barcode);
						}

						if (oFocusedControl && $.isFunction(oFocusedControl.fireSearch)) {
							oFocusedControl.fireSearch({
								query: oData.barcode,
								refreshButtonPressed: false
							});
						} else if (oFocusedControl && $.isFunction(oFocusedControl.fireChangeEvent)) {
							oFocusedControl.fireChangeEvent(oData.barcode);
						}
					}
				});
			}
			if (sap.ui.Device.system.phone && $.isFunction(window.screen.lockOrientation)) {
				window.screen.lockOrientation("portrait-primary");
			}

			// var __url = "/sap/opu/odata/sap/YDRTV_USER_DETAILS_SRV/GetAuth?APP='WORKLIST'";

			// this.AuthorizationInfoLoadedDeferred = $.ajax({
			// 	url: __url,
			// 	dataType: "json"
			// });

			//Get Shipping terms list
			this.fetchShippingTerms();
			
		},
		
		setScanId: function (sId) {
			this._sScanId = sId;
		},

		getScanId: function () {
			return this._sScanId;
		},
		_oScanListeners: {},
		setScanInput: function (oListener) {
			this._oScanListeners[oListener.id] = oListener;
		},
		
		_registerForBarcode: function () {
			// DataWedge Barcode scanner check only for android tc70 phone
			if (sap.ui.Device.os.name === "Android" && sap.ui.Device.system.phone) {
				if (window.datawedge) {
					// Unregister first and then register
					window.datawedge.unregisterBarcode();
					window.datawedge.registerForBarcode(function (oData) {
						if (this._sScanId) {
							if (this._oScanListeners.hasOwnProperty(this._sScanId) && this._oScanListeners[this._sScanId]) {
								var oListener = this._oScanListeners[this._sScanId];
								if (oListener.hasOwnProperty("onScan")) {
									oListener.onScan(oData.barcode);
								} else {
									// ODO: This needs to be depricated.
									oListener.object.setValue(oData.barcode);
									oListener.object.fireSearch({
										query: oData.barcode
									});
								}
							}
						} else {
							jQuery.sap.log.warning("Barcode scan NO INPUT - Type: " + oData.type + ", Code: " + oData.barcode);
						}
					}.bind(this));
				}
			} else {
				jQuery.sap.log.warning("No barcode scan functionality available.");
			}
		},
		
		fetchShippingTerms: function () {
			var labelModel = this.getModel();
			var vendorWorklistModel = this.getModel("VendorWorklistModel");
			labelModel.read("/FreightTermCodeSet", {
				success: function (data) {
					vendorWorklistModel.setProperty("/shippingTerms", data.results);
				},
				error: function (oError) {
					sap.m.MessageBox.show(
						JSON.parse(oError.responseText).error.message.value, {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: "Error",
							actions: [sap.m.MessageBox.Action.OK]
						});
				}
			});
		},
		
		metWorklist: function () {
			
            if (window.datawedge) {
                window.datawedge.registerForBarcode(function (oData) {
                    var focusedControlId = sap.ui.getCore().getCurrentFocusedControlId();

                    if (focusedControlId) {
                        var oFocusedControl = sap.ui.getCore().byId(focusedControlId);

                        if (oFocusedControl && $.isFunction(oFocusedControl.setValue)) {
                            oFocusedControl.setValue(oData.barcode);
                        }

                        if (oFocusedControl && $.isFunction(oFocusedControl.fireSearch)) {
                            oFocusedControl.fireSearch({
                                query: oData.barcode,
                                refreshButtonPressed: false
                            });
                        } else if (oFocusedControl && $.isFunction(oFocusedControl.fireChangeEvent)) {
                            oFocusedControl.fireChangeEvent(oData.barcode);
                        }
                    }
                });
            }

            this._backAfterLabeComplete = false;

            // call the base component's init function
            //UIComponent.prototype.init.apply(this, arguments);

            // initialize the error handler with the component
            this._oErrorHandler = new ErrorHandler(this);

            // set the devioEmailDomaince model
            this.setModel(modelsMET.createDeviceModel(), "device");
            // set the FLP model
            this.setModel(modelsMET.createFLPModel(), "FLP");

            // set the Appliation global model
            var appModel = this.setModel(modelsMET.createAppModel(), "APP");

            // set the Detail  model
            this.setModel(modelsMET.createDetailModel(), "Detail");
            // create the views based on the url/hash
            this.getRouter().initialize();

            var oModel = this.getModel();
            oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
            
            // set Auth model
			// var oAuthModel = new JSONModel();
			// this.setModel(oAuthModel, "oAuthModel");
			
			// set Email Domin Parameter model
			var oEmailDomain = new JSONModel();
			this.setModel(oEmailDomain, "oEmailDomain");
			
			var odataWorklistmodel = new JSONModel();
			this.setModel(odataWorklistmodel, "odataWorklistmodel");
			odataWorklistmodel.setSizeLimit(1000);


            // var __url = "/sap/opu/odata/sap/YDRTV_USER_DETAILS_SRV/GetAuth?APP='MET'";

            // this.AuthorizationInfoLoadedDeferred = $.ajax({
            //     url		: __url,
            //     dataType: "json"
            // });

            if (window.datawedge) {
                window.datawedge.registerForBarcode(function (oData) {
                    var focusedControlId = sap.ui.getCore().getCurrentFocusedControlId();

                    if (focusedControlId) {
                        var oFocusedControl = sap.ui.getCore().byId(focusedControlId);

                        if (oFocusedControl && $.isFunction(oFocusedControl.setValue)) {
                            oFocusedControl.setValue(oData.barcode);
                        }

                        if (oFocusedControl && $.isFunction(oFocusedControl.fireSearch)) {
                            oFocusedControl.fireSearch({
                                query: oData.barcode,
                                refreshButtonPressed: false
                            });
                        } else if (oFocusedControl && $.isFunction(oFocusedControl.fireChangeEvent)) {
                            oFocusedControl.fireChangeEvent(oData.barcode);
                        }
                    }
                });
            }

            if (sap.ui.Device.system.phone && $.isFunction(window.screen.lockOrientation)) {
                window.screen.lockOrientation("portrait-primary");
            }
			
			
		},
		
        metGetSite: function () {
            var oAppModel = this.getModel("APP");
            return oAppModel.getProperty("/site");
        },

        metSetSite: function (site) {
            var oAppModel = this.getModel("APP");
            return oAppModel.setProperty("/site", site);
        },

		//      ~~~~~~~~~~~~~~~~~~~~~~ CReate Verify Component.js details ~~~~~~~~~~~~~~~~~~~~~~
		createVerifyComp: function () {

			this.oListSelector = new ListSelector();
			// this._oErrorHandler = new ErrorHandler(this);

			// this.getModel().setDefaultCountMode("None");
			// this.getModel().setSizeLimit(1000);
			// this.getModel("verify").setSizeLimit(1000);

			var sManifestUrl = jQuery.sap.getModulePath("YRTV_ONE_TILE/YRTV_ONE_TILE/manifest", ".json"),
				oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data,
				aModels = oManifest["sap.ui5"].models;

			var component = this;

			var noSiteErrorHandler = function (oError) {
				if (oError.getParameter("response").responseText.indexOf("{") != -1) {
					if (JSON.parse(oError.getParameter("response").responseText).error.code.indexOf("YDRTV_ABORT") != -1) {

						if (!component.abortState) {
							component.abortState = true;

							MessageBox.show(
								JSON.parse(oError.getParameter("response").responseText).error.message.value, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: "Error",
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (oAction) {
										component.backToFLP();
									}
								});
						}
					}
				}
			};

			Object.keys(aModels).forEach(function (key, i) {
				if (window["sap-ui-debug"]) {
					if (aModels[key].dataSource) {
						var _key = key ? key : undefined;
						component.getModel(_key).setUseBatch(false);
					}
				}

				// component.getModel(_key).attachBatchRequestFailed(noSiteErrorHandler).attachRequestFailed(noSiteErrorHandler);
			});

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			// this.setModel(models.createFLPModel(), "FLP");

			//set ArticleModel
			var articleModel = new JSONModel();
			this.setModel(articleModel, "articleModel");

			//set ColorModel
			var colorModel = new JSONModel();
			this.setModel(colorModel, "colorModel");

			//set QuantityModel
			var qtyModel = new JSONModel();
			this.setModel(qtyModel, "qtyModel");

			//set LabelModel
			var labelModel = new JSONModel();
			this.setModel(labelModel, "labelModel");

			//set LabelModel
			var oSearchModel = new JSONModel();
			this.setModel(oSearchModel, "oSearchModel");

			//set VendorModel
			var vendorModel = new JSONModel();
			this.setModel(vendorModel, "vendorModel");

			// set DefectiveAllowance Model
			var defectiveAllowanceModel = new JSONModel();
			this.setModel(defectiveAllowanceModel, "defectiveAllowanceModel");

			// set Disposition code model
			var dispositionActionCodesModel = new JSONModel();
			this.setModel(dispositionActionCodesModel, "dispositionActionCodesModel");

			// set Auth model
			// var oAuthModel = new JSONModel();
			// this.setModel(oAuthModel, "oAuthModel");

			// set StoreHierarcy model
			var StoreHierarcy = new JSONModel();
			this.setModel(StoreHierarcy, "StoreHierarcy");

			// set Region model
			var oRegionModel = new JSONModel();
			this.setModel(oRegionModel, "oRegionModel");

			// set District model
			var oDistrictModel = new JSONModel();
			this.setModel(oDistrictModel, "oDistrictModel");

			// set Store model
			var oStoreModel = new JSONModel();
			this.setModel(oStoreModel, "oStoreModel");

			// set OAVendor model
			var sOAVendor = new JSONModel();
			this.setModel(sOAVendor, "sOAVendor");

			//additional details model
			var addtnDetailModel = new JSONModel();

			addtnDetailModel.setData({
				retail: "",
				onlineOnly: false,
				rga: "",
				attachment: "",
				rtvLoc: "",
				comments: ""
			});

			this.setModel(addtnDetailModel, "addtionalDetailModel");
			// UIComponent.prototype.init.apply(this, arguments);

			var oViewModel, fnSetAppNotBusy, iOriginalBusyDelay = 0;

			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});

			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function () {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getModel('CageModel').metadataLoaded().then(fnSetAppNotBusy);

			var __url = "/sap/opu/odata/sap/YDRTV_USER_DETAILS_SRV/GetAuth?APP='CREATE'";

			// this.AuthorizationInfoLoadedDeferred = $.ajax({
			// 	url: __url,
			// 	dataType: "json"
			// });

			this.getRouter().initialize();

			if (sap.ui.Device.system.phone && $.isFunction(window.screen.lockOrientation)) {
				window.screen.lockOrientation("portrait-primary");
			}
		},

		backToFLP: function () {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			oCrossAppNavigator.toExternal({
				target: {
					shellHash: "#Shell-home"
				}
			});
		},
		destroy: function () {
			if (sap.ui.Device.system.phone && $.isFunction(window.screen.unlockOrientation)) {
				window.screen.unlockOrientation();
			}
			// Deregister the datawedge bar code scan handler.
			if (window.datawedge) {
				window.datawedge.unregisterBarcode();
			}

			// this.oListSelector.destroy();
			// this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
			ga('remove');
		},
		googleAnalyticUpdate: function (dimentions) {
			//START GOOGLE ANALYTICS INTEGRATION
			try {
				//Set the page
				if (dimentions.page) {
					ga('set', 'page', dimentions.page); //launch point
				} else {
					ga('set', 'page', 'NA'); //launch point
				}

				//Set the site selected
				if (dimentions.site) {
					ga('set', 'dimension2', dimentions.site); //launch point
				} else {
					ga('set', 'dimension2', 'NA'); //launch point
				}

				//Set App Name
				ga('set', 'dimension3', 'RTV Create/Verify');

				//Set the userid
				ga('set', 'dimension1', window.sap.ushell.Container.getUser().getId()); //launch point

				//Dimenstion to decide the device hardware
				if (sap.ui.Device.system.combi) {
					ga('set', 'device category', 'combi'); //launch device
				} else if (sap.ui.Device.system.desktop) {
					ga('set', 'device category', 'desktop'); //launch device
				} else if (sap.ui.Device.system.phone) {
					ga('set', 'device category', 'phone'); //launch device
				} else if (sap.ui.Device.system.tablet) {
					ga('set', 'device category', 'tablet'); //launch device
				} else {
					ga('set', 'device category', 'other'); //launch device
				}

				ga('send', 'pageview', dimentions.page);
			} catch (err) {}
			//END GOOGLE ANALYTICS INTEGRATION
		},

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ CAGE AUDIT ~~~~~~~~~~~~~~~~~~~
		cageAuditComp: function () {
			// UIComponent.prototype.init.apply(this, arguments);

			// initialize the error handler with the component
			// this._oErrorHandler = new ErrorHandler(this);
            
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			this.setModel(new JSONModel(), "navObjDetailsModel");

			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		
		prepareShowList: function (oBuybackMasterModel) {
			var MainList = oBuybackMasterModel.getData().MainList;
			var ShowList = oBuybackMasterModel.getData().ShowList;
			MainList.forEach(function (MainListItem, i) {
				if (!ShowList.some(function (showListItem) {
						// if(showListItem.EBELN === MainListItem.EBELN){
						// 	if(parseFloat(showListItem.LABST) > 0) {
						// 		showListItem.OPEN_ARTICLE_COUNT = showListItem.OPEN_ARTICLE_COUNT + 1;
						// 	}
						// 	if(showListItem.TOTAL_ARTICLE_COUNT > 0) {
						// 		showListItem.TOTAL_ARTICLE_COUNT = showListItem.TOTAL_ARTICLE_COUNT + 1;
						// 	} else {
						// 		showListItem.TOTAL_ARTICLE_COUNT = 2;	
						// 	}
						// } 
						// MainListItem.OPEN_ARTICLE_COUNT = showListItem.OPEN_ARTICLE_COUNT;
						// MainListItem.TOTAL_ARTICLE_COUNT = showListItem.TOTAL_ARTICLE_COUNT;
						return showListItem.EBELN === MainListItem.EBELN;
					})) {
					// MainListItem.Duplicate = false;
					// var ListItem = MainListItem;
					// if (!ListItem.TOTAL_ARTICLE_COUNT) {
					// 	ListItem.TOTAL_ARTICLE_COUNT = 1;
					// }
					// if(parseFloat(MainListItem.LABST) > 0) {
					// 	ListItem.OPEN_ARTICLE_COUNT = 1;
					// } else if(parseFloat(MainListItem.LABST) === 0){
					// 	ListItem.OPEN_ARTICLE_COUNT = 0;
					// }
					ShowList.push(MainListItem);
				} else {
					// MainListItem.Duplicate = true;
				}
			});
			console.log(oBuybackMasterModel.getData());
			oBuybackMasterModel.checkUpdate(true);
		},
		
		loadMasterList: function () {
			var oModel, oBuybackMasterModel, oViewModel;
			oViewModel = this.getModel("appView");
			this.masterListLoaded = $.Deferred();
			oModel = this.getModel();
			oBuybackMasterModel = new JSONModel({
				MainList: [],
				ShowList: []
			});
			this.setModel(oBuybackMasterModel, "buybackMasterModel");
			var that = this;
			oModel.read("/PO_LISTSet", {
				filters: [new Filter("WERKS", "EQ", "")],
				success: function (oData) {
					oBuybackMasterModel.setProperty("/MainList", oData.results);
					that.prepareShowList(oBuybackMasterModel);
					oViewModel.setProperty("/busy", false);
					that.masterListLoaded.resolve();
				},
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
					if (oError.statusCode === 504) {
						MessageBox.show(
							oError.responseText, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: oError.message,
								actions: [sap.m.MessageBox.Action.OK]
							});
						return;
					}
					if (oError.responseText && JSON.parse(oError.responseText).error.message) {
						MessageBox.show(
							JSON.parse(oError.responseText).error.message.value, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Error",
								actions: [sap.m.MessageBox.Action.OK]
							});
					} else {
						return;
					}
				}
			});
		},
		
		buybackComp: function(){
			this.oListSelector = new ListSelector();
			this._oErrorHandler = new ErrorHandler(this);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			// this.setModel(models.createFLPModel(), "FLP");

			// call the base component's init function and create the App view
			// UIComponent.prototype.init.apply(this, arguments);

			var oModel, oBuybackMasterModel, oViewModel, fnSetAppNotBusy, iOriginalBusyDelay = 0;

			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			var ArticleTableInfoModel = new sap.ui.model.json.JSONModel();
			this.setModel(ArticleTableInfoModel, "ArticleTableInfoModel");

			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function () {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			// this.getModel().metadataLoaded().then(fnSetAppNotBusy);

			this.loadMasterList();

			// create the views based on the url/hash
			this.getRouter().initialize();
		}
	});
});