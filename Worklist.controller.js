sap.ui.define([
	"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/Worklist/BaseController",
	"sap/ui/model/json/JSONModel",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/Worklist/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Item",
	"sap/ui/core/Icon",
	"sap/m/MessageToast",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/MessageBox",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/routing/History",
	'sap/m/Token',
	"sap/m/HBox",
	"sap/m/VBox"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Item, Icon, MessageToast, Dialog, Button, Text, MessageBox,
	DateFormat, History, Token, HBox, VBox) {

	"use strict";

	var __controller__;

	return BaseController.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.Worklist.Worklist", {
		formatter: formatter,

		DateFormat: DateFormat.getDateInstance({
			pattern: "MM/dd/yyyy"
		}),

		Date2NumFormat: DateFormat.getDateInstance({
			pattern: "yyyyMMdd"
		}),

		formatDate: function (value) {
			if (!value) {
				return "";
			} else {
				// return this.DateFormat.format(new Date(value.getTime() + new Date().getTimezoneOffset() * 60000));
				return value;
				// return "";
			}
		},

		formatMobile: function (isMobile) {

			if (isMobile) {
				
				
				
				//AWAITING
				this.byId("StatusText").removeStyleClass("sapUiTinyMarginEnd");
				this.byId("idFooter2").setVisible(false);
				
				//Show mobile components, add CSS classes for tab headers
				this.byId("idWorklistFooter").setHeight("100%");
				this.byId("vendorScroll").setHeight("100%");
				this.byId("readyScroll").setHeight("100%");

				this.byId("idVendorScheduleShipmentTableItem").setType("Navigation");
				this.byId("idVendorReadyToShipTableItem").setType("Navigation");
				this.byId("idDateIcon").setWidth("90%");

				this.byId("readyScroll").setHeight("70vh");
				this.byId("vendorScroll").setHeight("70vh");
				
				//this.byId("page").setShowFooter(false); //Show it on destroy though!
				this.byId("idWorklistTabBar").removeStyleClass("tabClass");
				if (sap.ui.getCore().getConfiguration().getLanguage() === 'fr') {
					this.byId("idWorklistTabBar").addStyleClass("tabClassMobileFR");
					
				}
			    else{
					this.byId("idWorklistTabBar").addStyleClass("tabClassMobileEN");
			    }
			    this.byId("idWorklistTabBar").addStyleClass("tabClassMobile");
				this.byId("VendorTabBar").removeStyleClass("tabClass");
				this.byId("VendorTabBar").addStyleClass("tabClassMobile");
				this.byId("idWorklistTabBar").addStyleClass("tabClassMobileDom");
				this.byId("VendorTabBar").addStyleClass("tabClassMobileSub");
				this.byId("hbox0").setVisible(false);
				this.byId("hbox1").setVisible(false);
			} else {
				//Set density back to Cozy for headers
				this.byId("idWorklistTabBar").setTabDensityMode("Cozy");
				this.byId("VendorTabBar").setTabDensityMode("Cozy");
				this.byId("idWorklistTabBar").getItems().forEach(function (item) {
					if (item.setDesign) {
						item.setDesign("Vertical");
					}
				});
				this.byId("VendorTabBar").setVisible(false);
				this.byId("vbox0_1617304239567").setVisible(true);
			}

		},

		ExpandCollapse: function (oEvent) {
			var expand = false;
			//First check for button press
			if (oEvent.getSource) {
				var sourceLabel = oEvent.getSource().getParent().getCells()[0].getText();
				var icon = oEvent.getSource().getParent().getCells()[9];
			}
			else if (oEvent.currentTarget){
				var elem = oEvent.currentTarget.parentElement.parentElement.id;
				//var sourceLabel = oEvent.currentTarget.firstElementChild.lastElementChild.innerText;
				var sourceLabel = sap.ui.getCore().byId(elem).getParent().getCells()[0].getText();
				var icon = sap.ui.getCore().byId(elem).getParent().getCells()[9];
			}
			//Next check for text press
			else if (sap.ui.getCore().byId(this.getId()).getParent().getCells) {
				var sourceLabel = sap.ui.getCore().byId(this.getId()).getParent().getCells()[0].getText();
				var icon = sap.ui.getCore().byId(this.getId()).getParent().getCells()[9];
			}
			//If none of above, must be column press. 
			else {
				//CHANGE: This should never happen, since we don't have an onclick for the columns anymore
				//Go to parent, sibling, then child to get the element for the column. Must do "next sibling" twice
				//because first sibling is the colon ":"
				var elem = oEvent.currentTarget.parentElement.nextElementSibling.nextElementSibling.firstChild.id;
				var sourceLabel = sap.ui.getCore().byId(elem).getParent().getCells()[0].getText();
				var icon = sap.ui.getCore().byId(elem).getParent().getCells()[9];
			}

			if (icon.getProperty("src") === "sap-icon://navigation-down-arrow") {
				expand = true;
			}
			
			var item = $.sap.collapseHash[sourceLabel];
			if (item){
				//Should not be possible
				//MessageToast.show("CollapseFailedReopenItem");
				if (expand === true) {
					item.previousElementSibling.style.display = "flex";
					item.previousElementSibling.previousElementSibling.style.display = "flex";
					item.previousElementSibling.previousElementSibling.previousElementSibling.style.display = "flex";
					item.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.style.display = "flex";
					icon.setProperty("src", "sap-icon://navigation-up-arrow");
				} else {
					item.previousElementSibling.style.display = "None";
					item.previousElementSibling.previousElementSibling.style.display = "None";
					item.previousElementSibling.previousElementSibling.previousElementSibling.style.display = "None";
					item.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.style.display = "None";
					icon.setProperty("src", "sap-icon://navigation-down-arrow");
				}
				return;
			}
			
			//instead of looping doms, use hashmap on load 
			var doms = document.getElementsByClassName("sapMListTblSubCntRow");
			var domsArr = Array.prototype.slice.call(doms);
			domsArr.forEach(function (item) {
				//Must see if element matches label
				if (item.parentElement.parentElement.parentElement.previousElementSibling && item.parentElement.parentElement.parentElement.previousElementSibling
					.innerText) {
					var label = item.parentElement.parentElement.parentElement.previousElementSibling.innerText.trim();
				}
				if (item.children && item.children.length == 3 && item.children[0].innerText === "_" && item.children[2].innerText == "_" &&
					label === sourceLabel) {
					$.sap.collapseHash[label] = item;
					//We've found the selected column. Hide or show previous 4 based on "expand" value. Also change button icon since we succeeded
					//Previous 4 can be unhidden, but this one will NEVER be unhidden
					if (expand === true) {
						item.previousElementSibling.style.display = "flex";
						item.previousElementSibling.previousElementSibling.style.display = "flex";
						item.previousElementSibling.previousElementSibling.previousElementSibling.style.display = "flex";
						item.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.style.display = "flex";
						icon.setProperty("src", "sap-icon://navigation-up-arrow");
					} else {
						item.previousElementSibling.style.display = "None";
						item.previousElementSibling.previousElementSibling.style.display = "None";
						item.previousElementSibling.previousElementSibling.previousElementSibling.style.display = "None";
						item.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.style.display = "None";
						icon.setProperty("src", "sap-icon://navigation-down-arrow");
					}
					return;
				}
			});
			

		},
		
		refreshTimestampElapsed: function(){
			if (!window.noRefreshTimestamp){
				return true;
			}	
			if (((new Date().getTime() - window.noRefreshTimestamp) / 1000 ) >= 15){
				return true;
			}
			console.log("Skipped data load");
			//After skipping the timestamp once, we remove it
			window.noRefreshTimestamp = null;
			return false;
		},

		formatMobileDetails: function (isMobile, postfix) {

			if (!isMobile) {
				return;
			}
			var bundle = this.getView().getModel("WorkListi18n").getResourceBundle();

			this.byId("LabelHeading" + postfix).addStyleClass("none");
			this.byId("toolSpacer" + postfix).addStyleClass("none");
			this.byId("mastervbox" + postfix).removeStyleClass("sapUiMediumMarginTop");
			if (postfix === "R") {
				this.byId("LabelHeadingR").setText("");
				this.byId("labelColumn" + postfix).setWidth("30%");
			} else {
				this.byId("labelText").setText(bundle.getText("selectAll"));
				this.byId("labelColumn" + postfix).setWidth("40%");
				this.byId("labelText" + postfix).setText(bundle.getText("selectAll"));
			}

			//Set the select widths to 100%
			this.byId("carrier" + postfix).setWidth("100%");
			this.byId("shippingTerm" + postfix).setWidth("100%");
			this.byId("shippingTermLabel" + postfix).setText(bundle.getText("ShipmentDialog_ShippingTermM"));
			this.byId("postalCodeLabel" + postfix).setText(bundle.getText("ShipmentDialog_PostalCodeM"));
			this.byId("trackingIdLabel" + postfix).setText(bundle.getText("ShipmentDialog_TrackingIdM"));
			this.byId("provinceLabel" + postfix).setText(bundle.getText("ShipmentDialog_ProvinceM"));
			this.byId("noOfCartonsLabel" + postfix).setText(bundle.getText("ShipmentDialog_NoOfCartonsM"));

			//Now set label widths based on their length
			this.byId("vendorLabel" + postfix).addStyleClass("sapUiTinyMarginEnd").addStyleClass("centerAligned");
			this.byId("scheduleDateLabel" + postfix).addStyleClass("sapUiTinyMarginEnd").addStyleClass("centerAligned");
			this.byId("shippingTermLabel" + postfix).addStyleClass("sapUiTinyMarginEnd").addStyleClass("centerAligned").setWidth("5.2rem");
			this.byId("addressLabel" + postfix).addStyleClass("sapUiTinyMarginEnd").addStyleClass("centerAligned").setWidth("5.2rem");
			this.byId("cityLabel" + postfix).addStyleClass("sapUiTinyMarginEnd").addStyleClass("centerAligned").setWidth("5.2rem");
			this.byId("provinceLabel" + postfix).addStyleClass("sapUiTinyMarginEnd");
			this.byId("postalCodeLabel" + postfix).addStyleClass("sapUiTinyMarginEnd").setWidth("5rem");
			this.byId("carrierLabel" + postfix).addStyleClass("sapUiTinyMarginEnd").addStyleClass("centerAligned").setWidth("5.2rem");
			this.byId("specifyLabel" + postfix).addStyleClass("sapUiTinyMarginEnd").addStyleClass("centerAligned");
			this.byId("accountLabel" + postfix).addStyleClass("sapUiTinyMarginEnd").addStyleClass("centerAligned").setWidth("5.2rem");
			this.byId("noOfCartonsLabel" + postfix).addStyleClass("sapUiTinyMarginEnd");
			this.byId("trackingIdLabel" + postfix).addStyleClass("sapUiTinyMarginEnd").addStyleClass("centerAligned").setWidth("5.2rem");
			this.byId("totalWeight" + postfix).setWidth("6rem");

			//Add items to mobile boxes
			this.byId("mobilehboxVendor" + postfix).addItem(this.byId("vendorLabel" + postfix));
			this.byId("mobilehboxVendor" + postfix).addItem(this.byId("vendor" + postfix));

			this.byId("mobilevboxDate" + postfix).addItem(this.byId("scheduleDateLabel" + postfix));
			this.byId("mobilevboxDate" + postfix).addItem(this.byId("scheduleDate" + postfix));

			this.byId("mobilevboxShipTerms" + postfix).addItem(this.byId("shippingTermLabel" + postfix));
			this.byId("mobilevboxShipTerms" + postfix).addItem(this.byId("shippingTerm" + postfix));

			this.byId("mobilehboxAddress" + postfix).addItem(this.byId("addressLabel" + postfix));
			this.byId("mobilehboxAddress" + postfix).addItem(this.byId("address" + postfix));

			this.byId("mobilevboxCity" + postfix).addItem(this.byId("cityLabel" + postfix));
			this.byId("mobilevboxCity" + postfix).addItem(this.byId("city" + postfix));

			this.byId("mobilevboxProvince" + postfix).addItem(this.byId("provinceLabel" + postfix));
			this.byId("mobilevboxProvince" + postfix).addItem(this.byId("province" + postfix));

			this.byId("mobilevboxPostal" + postfix).addItem(this.byId("postalCodeLabel" + postfix));
			this.byId("mobilevboxPostal" + postfix).addItem(this.byId("postalCode" + postfix));

			this.byId("mobilehboxCarrier" + postfix).addItem(this.byId("carrierLabel" + postfix));
			this.byId("mobilehboxCarrier" + postfix).addItem(this.byId("carrier" + postfix));

			this.byId("mobilehboxCarrierName" + postfix).addItem(this.byId("specifyLabel" + postfix));
			this.byId("mobilehboxCarrierName" + postfix).addItem(this.byId("specify" + postfix));

			this.byId("mobilevboxAccount" + postfix).addItem(this.byId("accountLabel" + postfix));
			this.byId("mobilevboxAccount" + postfix).addItem(this.byId("account" + postfix));

			this.byId("mobilevboxCartons" + postfix).addItem(this.byId("noOfCartonsLabel" + postfix));
			this.byId("mobilevboxCartons" + postfix).addItem(this.byId("noOfCartons" + postfix));

			this.byId("mobilehboxTracking" + postfix).addItem(this.byId("trackingIdLabel" + postfix));
			this.byId("mobilehboxTracking" + postfix).addItem(this.byId("trackingId" + postfix));

			//And change margins on items table
			this.byId("labelBox" + postfix).removeStyleClass("sapUiLargeMarginTop");
			this.byId("labelBox" + postfix).addStyleClass("sapUiTinyMarginTop");
		},

		onInit: function () {
			__controller__ = this;

			this._init = true;
			this.siteId = "";
			this.oCountLoadFinishedDeferred = jQuery.Deferred();
			this.setModel(new JSONModel({
				PendingScanList: [],
				ScannedLabelsList: [],
				Count: {
					FLOOR_NUM: 0,
					FLOOR_DEN: 0,
					AWAITING_NUM: 0
				}
			}), "FloorModel");

			this.getModel("FloorModel").setSizeLimit(1000);
			this.getOwnerComponent().getModel().setSizeLimit(1000);
			this.setModel(new JSONModel({
				PendingScanList: [],
				ScannedLabelsList: [],
				Count: {
					DESTROY_NUM: 0,
					DESTROY_DEN: 0
				}
			}), "DestroyModel");
			this.getModel("DestroyModel").setSizeLimit(1000);

			this.getView().addEventDelegate({
				onBeforeFirstShow: function () {
					this.loadCounter();
				}.bind(this)
			});

			//Check if mobile. If so, several things to set
			this.formatMobile(sap.ui.Device.system.phone);

			this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this._oRouter.attachRouteMatched(this.handleRouteMatched, this);

			var controller = this;
			var iconTabHeader = this.byId("idWorklistTabBar")._getIconTabHeader();
			var oldSetSelectedItem = iconTabHeader.setSelectedItem;
			var that = this;
			iconTabHeader.setSelectedItem = function (oItem, bAPIchange) {
			
				if (this.oSelectedItem) {
					var oTable = sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable");
					if (this.oSelectedItem.getId().indexOf("destroyTab") !== -1 && oTable && oTable.getSelectedItems().length > 0){
						var dialog =
						new Dialog({
							title: that.getResourceBundle().getText("Warning"),
							type: 'Message',
							state: 'Warning',
							content: new Text({
								text: that.getResourceBundle().getText("WantToGoBack")
							}),
							beginButton: new Button({
								text: __controller__.getResourceBundle().getText('YES'),
								press: function () {
									oTable.removeSelections(true);
									controller.onTabChangeValidation(this, controller, "DestroyModel", oldSetSelectedItem, oItem, bAPIchange, iconTabHeader);
									dialog.close();
								}
							}),
							endButton: new Button({
								text: that.getResourceBundle().getText("CANCEL"),
								press: function () {
									dialog.close();
								}
							}),
							afterClose: function () {
								dialog.destroy();
							}
						});
						
						dialog.open();
					
					}
					else{
						if (this.oSelectedItem.getId().indexOf("floorTab") !== -1) {
	
							controller.onTabChangeValidation(this, controller, "FloorModel", oldSetSelectedItem, oItem, bAPIchange, iconTabHeader);
	
						} else if (this.oSelectedItem.getId().indexOf("destroyTab") !== -1) {
	
							controller.onTabChangeValidation(this, controller, "DestroyModel", oldSetSelectedItem, oItem, bAPIchange, iconTabHeader);
	
						} else {
	
							oldSetSelectedItem.apply(iconTabHeader, [oItem, bAPIchange]);
							//var refreshBtn = controller.getView().byId("idRefreshBtn");
							//refreshBtn.setVisible(true);
	
						}
					}
				}
				
			};

			if (jQuery.sap.getObject("sap.ushell.Container")) {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				if (oCrossAppNavigator) {
					this.byId("page").setShowNavButton(true);
				}
			}

			var oModel = new sap.ui.model.json.JSONModel({
				minDate: new Date()
			});

			//Hide data for header table; only columns
			this.getView().setModel(oModel, "dateModel");

			//Finally, IF we came back from RTV worklist, we must ensure we are still in RTV worklist on return
			if (window.navType == "RDY" && sap.ui.Device.system.phone) {
				this.byId("VendorTabBar").setSelectedKey("Ready");
				this.getView().byId('vbox0').setVisible(false);
				this.getView().byId('vbox0_1617304239567').setVisible(true);
			}

		},

		onTabChangeValidation: function (that, controller, model, oldSetSelectedItem, oItem, bAPIchange, iconTabHeader) {

			if (that.oSelectedItem === oItem) {
				return;
			}

			var ModelData = controller.getModel(model).getData();
			var completeBtn = controller.getView().byId("idCompleteBtn");
			// var selectAllSwitch = controller.getView().byId("idSelectAllSwitch");

			if (ModelData.ScannedLabelsList && ModelData.ScannedLabelsList.length > 0) {
				var dialog = new Dialog({
					title: controller.getResourceBundle().getText('Warning'),
					type: 'Message',
					state: 'Warning',
					content: new Text({
						text: controller.getResourceBundle().getText("AreYouSureYouWantToExit")
					}),
					beginButton: new Button({
						text: controller.getResourceBundle().getText('YES'),
						press: function () {
							dialog.close();
							ModelData.PendingScanList = ModelData.PendingScanList.concat(ModelData.ScannedLabelsList);
							delete ModelData.ScannedLabelsList;
							completeBtn.setEnabled(false);
							// selectAllSwitch.setState(false);
							// selectAllSwitch.setEnabled(false);
							controller.getModel(model).checkUpdate(true);
							oldSetSelectedItem.apply(iconTabHeader, [oItem, bAPIchange]);
						}
					}),
					endButton: new Button({
						text: controller.getResourceBundle().getText('CANCEL'),
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});

				dialog.open();
			} else {
				var oldTab = "";
				if (oItem.getId().indexOf("destroyTab") !== -1) {
					oldTab = "destroyTab";
				}
				if (oItem.getId().indexOf("floorTab") !== -1) {
					oldTab = "floorTab";
				}

				var isCalligCounter = true;
				if (model === "FloorModel" && oldTab === "destroyTab") {
					isCalligCounter = false;
				}
				if (model === "DestroyModel" && oldTab === "floorTab") {
					isCalligCounter = false;
				}

				oldSetSelectedItem.apply(iconTabHeader, [oItem, bAPIchange]);
			}

		},
		onInfoPress: function () {
			var bundle = this.getView().getModel("WorkListi18n").getResourceBundle();
			var titleHelpMessage = bundle.getText("titleHelpMessage"); //"Manually Added";
			var blackIconMessage = bundle.getText("blackIconHelpMessage"); //"Manually Added";
			var greenIconMessage = bundle.getText("greenIconHelpMessage"); //"Repriortized";
			var redIconMessage = bundle.getText("redIconHelpMessage"); //"Failed Audit";

			var ovl = new sap.m.VBox({
				width: "100%"
			});

			var hBoxSTrans = new sap.m.HBox({
				width: "100%",
				alignItems: "Center",
				justifyContent: "Start"
			});
			var hBoxUTrans = new sap.m.HBox({
				width: "100%",
				alignItems: "Center",
				justifyContent: "Start"
			});
			// var hBoxPRTrans = new sap.m.HBox({
			// 	width: "100%",
			// 	alignItems: "Center",
			// 	justifyContent: "Start"
			// });
			var hBoxPRTVWP = new sap.m.HBox({
				width: "100%",
				alignItems: "Center",
				justifyContent: "Start"
			});
			var hBoxAwVMin = new sap.m.HBox({
				width: "100%",
				alignItems: "Center",
				justifyContent: "Start"
			});

			var hBoxMlNtSt = new sap.m.HBox({
				width: "100%",
				alignItems: "Center",
				justifyContent: "Start"
			});
			// var hBoxEmailE  = new sap.m.HBox({width: "100%", alignItems:"Center", justifyContent:"Start"});

			var btnSTransText = new sap.m.Text({
				text: bundle.getText('infoT1'),
				class: "sapUiSmallMarginBegin"
			});
			var btnUTransText = new sap.m.Text({
				text: bundle.getText('infoT2'),
				class: "sapUiSmallMarginBegin"
			});
			// var btnPRTransText = new sap.m.Text({
			// 	text: bundle.getText('infoT7'),
			// 	class: "sapUiSmallMarginBegin"
			// });
			var btnPRTVWPText = new sap.m.Text({
				text: bundle.getText('infoT3'),
				class: "sapUiSmallMarginBegin"
			});
			var btnAwVMinText = new sap.m.Text({
				text: bundle.getText('infoT4'),
				class: "sapUiSmallMarginBegin"
			});
			var btnMlNtStText = new sap.m.Text({
				text: bundle.getText('infoT6'),
				class: "sapUiSmallMarginBegin"
			});
			// var btnEmailEText = new sap.m.Text({text:bundle.getText('infoT5'), class:"sapUiSmallMarginBegin"});

			var btnSTrans = new sap.m.Button({
				icon: "sap-icon://accept",
				type: "Accept",
				class: "sapUiSmallMarginEnd"
			});
			var btnUTrans = new sap.m.Button({
				icon: "sap-icon://decline",
				type: "Reject",
				class: "sapUiSmallMarginEnd"
			});
			// var btnPRTrans = new sap.m.Button({
			// 	icon: "sap-icon://lateness",
			// 	type: "Emphasized",
			// 	class: "sapUiSmallMarginEnd"
			// });
			var btnPRTVWP = new sap.m.Button({
				icon: "sap-icon://pending",
				type: "Emphasized",
				class: "sapUiSmallMarginEnd"
			});
			var btnAwVMin = new sap.m.Button({
				icon: "sap-icon://collections-insight",
				type: "Emphasized",
				class: "sapUiSmallMarginEnd"
			});
			var btnMlNtSt = new sap.m.Button({
				icon: "sap-icon://email",
				type: "Reject",
				class: "sapUiSmallMarginEnd"
			});
			// var btnEmailE = new sap.m.Button({icon: "sap-icon://email", type: "Reject", class:"sapUiSmallMarginEnd" });

			btnSTrans.addStyleClass("iconPaddingRightBottom");
			btnUTrans.addStyleClass("iconPaddingRightBottom");
			btnPRTVWP.addStyleClass("iconPaddingRightBottom");
			btnAwVMin.addStyleClass("iconPaddingRightBottom");
			btnMlNtSt.addStyleClass("iconPaddingRightBottom");
			// btnPRTrans.addStyleClass("iconPaddingRightBottom");

			btnSTransText.addStyleClass("iconPaddingRightBottom");
			btnUTransText.addStyleClass("iconPaddingRightBottom");
			btnPRTVWPText.addStyleClass("iconPaddingRightBottom");
			btnAwVMinText.addStyleClass("iconPaddingRightBottom");
			btnMlNtStText.addStyleClass("iconPaddingRightBottom");
			// btnPRTransText.addStyleClass("iconPaddingRightBottom");
			// btnEmailE.addStyleClass("iconPaddingRightBottom");

			hBoxSTrans.addItem(btnSTrans);
			hBoxUTrans.addItem(btnUTrans);
			hBoxPRTVWP.addItem(btnPRTVWP);
			hBoxAwVMin.addItem(btnAwVMin);
			hBoxMlNtSt.addItem(btnMlNtSt);
			// hBoxPRTrans.addItem(btnPRTrans);
			// hBoxEmailE.addItem(btnEmailE);

			hBoxSTrans.addItem(btnSTransText);
			hBoxUTrans.addItem(btnUTransText);
			hBoxPRTVWP.addItem(btnPRTVWPText);
			hBoxAwVMin.addItem(btnAwVMinText);
			hBoxMlNtSt.addItem(btnMlNtStText);
			// hBoxPRTrans.addItem(btnPRTransText);
			// hBoxEmailE.addItem(btnEmailEText);

			ovl.addItem(hBoxSTrans);
			ovl.addItem(hBoxUTrans);
			ovl.addItem(hBoxPRTVWP);
			ovl.addItem(hBoxAwVMin);
			ovl.addItem(hBoxMlNtSt);
			// ovl.addItem(hBoxPRTrans);
			// ovl.addItem(hBoxEmailE);

			var dialog = new sap.m.Dialog({
				icon: "sap-icon://message-information",
				title: titleHelpMessage, //"Bay Rank Information",
				type: "Message",
				state: "None",
				content: ovl,
				customHeader: new sap.m.Bar({
					contentMiddle: [new sap.m.Text({
						text: titleHelpMessage
					})],
					contentRight: [new sap.m.Button({
						icon: "sap-icon://decline",
						press: function () {
							dialog.destroy();
						}
					})]
				}),
				// beginButton: new sap.m.Button({
				//     text: bundle.getText("ok"),
				//     press: function() {
				//         dialog.destroy();
				//         // __isDialogOpen__ = false;
				//     }
				// }),
				afterClose: function () {
					dialog.destroy();
					// __isDialogOpen__ = false;
				}
			});
			dialog.open();
			//       __isDialogOpen__ = true;
			// 	}
			// });
		},
		handleRouteMatched: function (evt) {
			this._AuthorizationAccess();
			// this._domainData();
			// var i = window.location.hash.search("/tab/");
			// var l = window.location.hash.length;
			// this.onTabSelect_hash(window.location.hash.substring(i + 5, l));
			$.sap.collapseHash = {};
			this.destroyDialogs();
			//Finally, if dialogs exist, destroy them
			
		},
		setCollapseHash: function () {
			$.sap.collapseHash = {};
			var doms = document.getElementsByClassName("sapMListTblSubCntRow");
			var domsArr = Array.prototype.slice.call(doms);
			domsArr.forEach(function (item) {
				//Must see if element matches label
				if (item.parentElement.parentElement.parentElement.previousElementSibling && item.parentElement.parentElement.parentElement.previousElementSibling
					.innerText) {
					var label = item.parentElement.parentElement.parentElement.previousElementSibling.innerText.trim();
				}
				if (item.children && item.children.length == 3 && item.children[0].innerText === "_" && item.children[2].innerText == "_") {
					$.sap.collapseHash[label] = item;
				}
			});

			doms = document.getElementsByClassName("sapMListTblSubCntBlock");
			domsArr = Array.prototype.slice.call(doms);
			var that = this;
			domsArr.forEach(function (item) {
				//Must see if element matches label. Get SECOND last element (after the expand/collapse) and see if it matches the underscore (_) character
				if (item.lastElementChild && item.lastElementChild.previousElementSibling
				&& item.lastElementChild.previousElementSibling.firstChild && item.lastElementChild.previousElementSibling.firstChild.innerText === "_"){
					item.onclick = that.ExpandCollapse;
				}
			});
			
			
		},
		fnSetVisiblePhone: function () {
			return sap.ui.Device.system.phone;
		},
		fnSetVisibleDesktop: function () {
			// return true;
			return !sap.ui.Device.system.phone;
		},

		openVendorDetails: function (evt) {
			// var sPath = evt.getSource().getBindingContext().sPath.split('/')[2];
			var sPath = evt.getSource().getBindingContextPath().split('/')[1];
			var bReplace = true;

			this.getRouter().navTo("vendordetails", {
				vendor: sPath
			}, bReplace);

		},
		loadCounter: function () {
			/*
			// var labelModel = this.getModel("labelModel");
			var labelModel = this.getOwnerComponent().getModel();
			var floorModel = this.getModel("FloorModel");
			var destroyModel = this.getModel("DestroyModel");
			var vendorModel = this.getModel("VendorModel");
			var tabBar = this.getView().byId("idWorklistTabBar");
			tabBar.setBusy(true);
			tabBar.setBusyIndicatorDelay(0);
			var that = this;
			labelModel.callFunction("/GET_COUNT", {
				// labelModel.read("/GET_COUNT", {
				urlParameters: {
					"WERKS": this.siteId
				},
				success: function (oData) {
					//noResponseDeferred.resolve();
					that.siteId = oData.WERKS;
					tabBar.setBusy(false);
					floorModel.setProperty("/Count", {
						FLOOR_NUM: parseInt(oData.FLOOR_NUM),
						FLOOR_DEN: parseInt(oData.FLOOR_DEN),
						AWAITING_NUM: parseInt(oData.AWAITING_NUM),
						SYSTEM_DATE: oData.SYSTEM_DATE
					});
					destroyModel.setProperty("/Count", {
						DESTROY_NUM: parseInt(oData.DESTROY_NUM),
						DESTROY_DEN: parseInt(oData.DESTROY_DEN),
						SYSTEM_DATE: oData.SYSTEM_DATE
					});
					var VendTot = Number(oData.VENDOR_NUM) + Number(oData.VENDOR_DEN);
					vendorModel.setProperty("/Count", {
						VENDOR_NUM: parseInt(oData.VENDOR_NUM),
						VENDOR_DEN: parseInt(oData.VENDOR_DEN),
						VENDOR_TOT: VendTot,
						SYSTEM_DATE: oData.SYSTEM_DATE
					});
					floorModel.updateBindings(true);
					destroyModel.updateBindings(true);
					vendorModel.updateBindings(true);
					var selectedTab = tabBar.getSelectedKey();
					if (selectedTab === "vendor") {
						// that.getView().byId("idVendorDueDate").rerender();
					}
					that.oCountLoadFinishedDeferred.resolve();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {
					//noResponseDeferred.resolve();
					sap.ui.core.BusyIndicator.hide();
					tabBar.setBusy(false);
					that.serviceError(oError);

				}
			});
			*/
		},

		//Private method to search RTV label in Floor Tab

		_applyRTVLabelSearch: function (sQuery) {

			this._applyLabelSearch(sQuery, "FloorModel");

			this._displayPrintSwitch();

		},

		_applyRTVDestroyLabelSearch: function (sQuery) {

			this._applyLabelSearch(sQuery, "DestroyModel");

			this._displayDonateSwitch();

			// sap.ui.getCore().byId("destroy--idDestroyScannedTable").rerender();
			// sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable").rerender();
		},

		_applyLabelSearch: function (sQuery, model) {
			var destroyModel = this.getModel("DestroyModel");
			var modelData = this.getView().getModel(model).getData();
			// var selectAllSwitch = this.getView().byId("idSelectAllSwitch");
			var oMsg = this.getResourceBundle().getText("Scanned");
			var that = this;
			var oHide;
            var oTable = sap.ui.getCore().byId('destroy--idDestroyPendingScannedTable');
            
			if (oTable.getSelectedItems().some(function (item, i) {
					return item.getBindingContext("DestroyModel").getObject().LABEL_NUM === sQuery;
				})) {
				this.onMessageDialog("error", this.getResourceBundle().getText("labelAlreadyScannedMsg"), this);
				return;
			}

			if (!modelData.PendingScanList.some(function (item, i) {
					if (item && item.LABEL_NUM === sQuery) {
						if (item.DESTROY_HIDE === 'X') {
							oHide = 'X';
							// that.onMessageDialog("Warning", that.getResourceBundle().getText("threshold"), that);
							return false;
						} else {
							//Move label from pending list to scanned list
							// modelData.ScannedLabelsList = modelData.ScannedLabelsList.concat(modelData.PendingScanList.splice(i, 1));
							
							var sRowSelect = oTable.getItems()[i];
							// oTable.setSelectedItem(sRowSelect);
							var insertData = modelData.PendingScanList[i];
							modelData.PendingScanList.splice(i, 1);
							modelData.PendingScanList.splice(0, 0, insertData);
							modelData.ScannedLabelsList.push(modelData.PendingScanList[0]);
							destroyModel.setProperty("/PendingScanList", modelData.PendingScanList);
							var sSelected = oTable.getSelectedItems().length;
							for (i = 0; i < sSelected + 1; i++) {
								oTable.setSelectedItem(oTable.getItems()[i]);
							}

							// for (var a = 0; a < oTable.getItems().length; a++) {
							// 	var labelNum = oTable.getItems()[a].getBindingContext("DestroyModel").getObject().LABEL_NUM;
							// 	oTable.getItems()[a].getCells()[0].removeStyleClass("redLabelWorklist");
							// 	oTable.getItems()[a].getCells()[0].removeStyleClass("yellowLabelWorklist");
							// 	oTable.getItems()[a].getCells()[0].removeStyleClass("greenLabelWorklist");
							// 	oTable.getItems()[a].getCells()[0].removeStyleClass("whiteLabelWorklist");
							// 	if (labelNum.indexOf('98181') === 0) {
							// 		oTable.getItems()[a].getCells()[0].addStyleClass('redLabelWorklist');
							// 	} else if (labelNum.indexOf('98182') === 0) {
							// 		oTable.getItems()[a].getCells()[0].addStyleClass('yellowLabelWorklist');
							// 	} else if (labelNum.indexOf('98183') === 0) {
							// 		oTable.getItems()[a].getCells()[0].addStyleClass('greenLabelWorklist');
							// 	}
							// 	if (labelNum.indexOf('98184') === 0) {
							// 		oTable.getItems()[a].getCells()[0].addStyleClass('whiteLabelWorklist');
							// 	}
							// }
							MessageToast.show(oMsg);
							//only for Floor tab - adding PRINT property to print switch
							// if (model === "FloorModel") {
							// 	if (item.PRINT_FLAG === "X") {
							// 		modelData.ScannedLabelsList[modelData.ScannedLabelsList.length - 1].PRINT_STATE = true;
							// 		modelData.ScannedLabelsList[modelData.ScannedLabelsList.length - 1].PRINT_ENABLE = false;
							// 		// selectAllSwitch.setState(false);
							// 	} else {
							// 		modelData.ScannedLabelsList[modelData.ScannedLabelsList.length - 1].PRINT_STATE = false;
							// 		modelData.ScannedLabelsList[modelData.ScannedLabelsList.length - 1].PRINT_ENABLE = true;
							// 		// selectAllSwitch.setState(false);
							// 	}
							// }
							//only for Destroy tab - adding DESTROY property to donate switch
							// if (model === "DestroyModel") {
							// 	modelData.ScannedLabelsList[modelData.ScannedLabelsList.length - 1].DONATE = false;
							// 	// selectAllSwitch.setState(false);
							// }
						}
						return true;
					}
				})) {

				if (model === "FloorModel") {
					this.onMessageDialog("error", this.getResourceBundle().getText(
						"TheLabelIsNotInReturnToFloorSatus"), this);
					return;
				} else if (oHide === 'X') {
					this.onMessageDialog("error", this.getResourceBundle().getText("threshold"), this);
					return;
				} else {
					this.onMessageDialog("error", this.getResourceBundle().getText(
						"TheLabelIsNotInDestroyStatus"), this);
					return;
				}

			}

			this.getView().getModel(model).updateBindings();
		},

		_displayDonateSwitch: function () {

			var rejectBtn = this.getView().byId("idRejectBtn");
			var completeBtn = this.getView().byId("idCompleteBtn");
			var donateBtn = this.getView().byId("idDonateBtn");
			var len = sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable").getSelectedItems().length;

			if (len > 0) {
				donateBtn.setEnabled(true);
				completeBtn.setEnabled(true);
				rejectBtn.setEnabled(true);
			} else {
				donateBtn.setEnabled(false);
				completeBtn.setEnabled(false);
				rejectBtn.setEnabled(false);
			}
			// var modelData = this.getView().getModel("DestroyModel").getData();
			// // var donateAllSwitch = this.getView().byId("idSelectAllSwitch");
			// var completeBtn = this.getView().byId("idCompleteBtn");
			// var rejectBtn = this.getView().byId("idRejectBtn");

			// if (modelData.ScannedLabelsList.length > 0) {
			// 	// donateAllSwitch.setEnabled(true);
			// 	completeBtn.setEnabled(true);
			// 	rejectBtn.setEnabled(true);
			// 	rejectBtn.setVisible(true);
			// 	this.getView().byId("idDonateBtn").setEnabled(true);
			// 	this.getView().byId("idDonateBtn").setVisible(true);
			// 	this.getView().byId("idDonateBtn");
			// }
			// var scannedLabelArray = [];
			// modelData.ScannedLabelsList.forEach(function (scanned) {
			// 	if (scanned.DONATED == "Y") {
			// 		scanned.DONATE = true;
			// 		scannedLabelArray.push(scanned);
			// 	}
			// });
			// this.getView().getModel("DestroyModel").setProperty("ScannedLabelsList", scannedLabelArray);
			// this.getView().getModel("DestroyModel").updateBindings(true);
		},

		_displayPrintSwitch: function () {
			var modelData = this.getView().getModel("FloorModel").getData();
			// var printAllSwitch = this.getView().byId("idSelectAllSwitch");
			var completeBtn = this.getView().byId("idCompleteBtn");

			if (modelData.ScannedLabelsList.length > 0) {
				// printAllSwitch.setEnabled(true);
				completeBtn.setEnabled(true);
			}

		},

		onSelectAllChange: function (evt) {
			var sKey = this.byId("idWorklistTabBar").getSelectedKey();
			if (sKey === "floor") {
				var printAllBtn = evt.getSource();
				var floorModel = this.getView().getModel("FloorModel");
				var floorModelData = floorModel.getData();
				if (printAllBtn.getState()) {
					for (var i = 0; i < floorModelData.ScannedLabelsList.length; i++) {
						floorModelData.ScannedLabelsList[i].PRINT_STATE = true;
					}
				} else {
					for (var j = 0; j < floorModelData.ScannedLabelsList.length; j++) {
						if (floorModelData.ScannedLabelsList[j].PRINT_FLAG === "X") {
							floorModelData.ScannedLabelsList[j].PRINT_STATE = true;
						} else {
							floorModelData.ScannedLabelsList[j].PRINT_STATE = false;
						}
					}
				}
				floorModel.checkUpdate();
			} else if (sKey === "destroy") {
				var donateAllBtn = evt.getSource();
				donateAllBtn.addStyleClass("BtnClor");
				var destroyModel = this.getView().getModel("DestroyModel");
				var destroyModelData = destroyModel.getData();
				if (donateAllBtn.getState()) {
					for (i = 0; i < destroyModelData.ScannedLabelsList.length; i++) {
						destroyModelData.ScannedLabelsList[i].DONATE = true;
					}
				} else {
					for (j = 0; j < destroyModelData.ScannedLabelsList.length; j++) {
						destroyModelData.ScannedLabelsList[j].DONATE = false;
					}
				}
				destroyModel.checkUpdate();
				this._enableRejectBtn();
			}
		},

		//on row level donate button change
		onDonateChange: function (oEvent) {
			// var donateAllSwitch = this.getView().byId("idSelectAllSwitch");
			// var rejectBtn = this.getView().byId("idRejectBtn");
			// if (!oEvent.getSource().getState()) {
			// 	donateAllSwitch.setState(false);
			// 	this._enableRejectBtn();
			// } else {
			// 	rejectBtn.setEnabled(false);
			// }
		},
		_enableRejectBtn: function () {
			var DestroyModel = this.getView().getModel("DestroyModel");
			var scannedLabels = DestroyModel.getData().ScannedLabelsList;
			var rejectBtn = this.getView().byId("idRejectBtn");
			// rejectBtn.setEnabled(!scannedLabels.some(function (element, index, array) {
			// 	if (element.DONATE === true) {
			// 		return true;
			// 	}
			// }.bind(this)));
		},

		//on row level print button change
		onPrintChange: function (oEvent) {
			// var printAllSwitch = this.getView().byId("idSelectAllSwitch");
			if (!oEvent.getSource().getState()) {
				printAllSwitch.setState(false);
			}
		},

		//Private method for Floor Tab
		_floorTab: function (key) {
			var tabFilter = this.byId("floorTab");
			// var labelModel = this.getModel("labelModel");
			var labelModel = this.getOwnerComponent().getModel();

			var controller = this;
			this.getOwnerComponent().googleAnalyticUpdate({
				page: "Floor",
				site: this.siteId
			}); //Google Analytics
			if (!tabFilter.data("loaded")) {
				var __content__ = sap.ui.xmlfragment("floor", "YRTV_ONE_TILE.YRTV_ONE_TILE.view.Worklist.FloorTabFilter", this);
				if ($.isArray(__content__)) {
					__content__.reverse().forEach(function (item, i) {
						tabFilter.insertContent(item, 0);
					});
				} else {
					tabFilter.insertContent(__content__, 0);
				}

				var pendingScanLabelNumber = sap.ui.getCore().byId("floor--PendingScanLabelNumber");
				var scannedLabelNumber = sap.ui.getCore().byId("floor--ScannedLabelNumber");

				var labelNumber
				= {
					onAfterRendering: function () {
						var labelNum = this.getBindingContext("FloorModel").getObject().LABEL_NUM;

						this.removeStyleClass("redLabelWorklist");
						this.removeStyleClass("yellowLabelWorklist");
						this.removeStyleClass("greenLabelWorklist");
						this.removeStyleClass("whiteLabelWorklist");

						if (labelNum.indexOf('98181') === 0) {
							this.addStyleClass('redLabelWorklist');
						} else if (labelNum.indexOf('98182') === 0) {
							this.addStyleClass('yellowLabelWorklist');
						} else if (labelNum.indexOf('98183') === 0) {
							this.addStyleClass('greenLabelWorklist');
						}
						if (labelNum.indexOf('98184') === 0) {
							this.addStyleClass('whiteLabelWorklist');
						}
					}
				};

				pendingScanLabelNumber.addDelegate(labelNumberDelegate, false, pendingScanLabelNumber, true);
				scannedLabelNumber.addDelegate(labelNumberDelegate, false, scannedLabelNumber, true);

				var oScanField = sap.ui.getCore().byId("floor--idFloorSearchFld"),
					oSId = oScanField.getId();
				this.onScanField(oSId);

				jQuery.when(this.oCountLoadFinishedDeferred).then(jQuery.proxy(function () {
					var systemDate = this.getView().getModel("FloorModel").getData().Count.SYSTEM_DATE;
					var todayAsInt = Date.parse(systemDate);

					var scannedLabelDueDate = sap.ui.getCore().byId("floor--ScannedLabelDueDate");
					var pendingScanLabelDueDate = sap.ui.getCore().byId("floor--PendingScanLabelDueDate");

					var dueDateDelegate = {
						onAfterRendering: function () {
							var dueDate = this.getBindingContext("FloorModel").getObject().DUE_DATE;
							var bLength = dueDate.length;
							var bDate;
							if (bLength === 10) {
								bDate = dueDate.slice(5, 7) + "/" + dueDate.slice(8, 10) + "/" + dueDate.slice(0, 4);
							} else {
								bDate = dueDate.slice(4, 6) + "/" + dueDate.slice(6, 8) + "/" + dueDate.slice(0, 4);
							}
							var aDueDate = new Date(bDate);
							var oToday = new Date();
							if (aDueDate <= oToday) {
								// if (Date.parse(dueDate) <= todayAsInt) {
								if (!this.hasStyleClass('dueDateColor')) {
									this.addStyleClass('dueDateColor');
								}
							} else {
								this.removeStyleClass("dueDateColor");
							}
						}
					};
					scannedLabelDueDate.addDelegate(dueDateDelegate, false, scannedLabelDueDate, true);
					pendingScanLabelDueDate.addDelegate(dueDateDelegate, false, pendingScanLabelDueDate, true);

				}, this));
				tabFilter.data("loaded", "X");
			
				
			}

			//Filters for Floor
			var oFilters = [
				new sap.ui.model.Filter("WERKS", "EQ", this.siteId),
				new sap.ui.model.Filter("APP_SRC", "EQ", "FLOOR")
			];

			var floorModel = this.getModel("FloorModel");
			var destroyModel = this.getModel("DestroyModel");
			var vendorModel = this.getModel("VendorModel");
			var floorPendingTable = sap.ui.getCore().byId("floor--idFloorPendingScannedTable");
			var that = this;
			floorPendingTable.setBusy(true);
			floorPendingTable.setBusyIndicatorDelay(0);
			labelModel.read("/WLLabelSet", {
				filters: oFilters,
				success: function (oData) {
					if (oData.results.length > 0) {
						that.siteId = oData.results[0].WERKS;
					}
					sap.ui.core.BusyIndicator.hide();
					floorPendingTable.setBusy(false);
					floorModel.setProperty("/PendingScanList", oData.results);
					floorModel.setProperty("/ScannedLabelsList", []);
					// sap.ui.getCore().byId("floor--idFloorSearchFld").setValue("");
					// sap.ui.getCore().byId("floor--idFloorSearchFld").focus();
					that.onVKeypadHide();
				},
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
					that.serviceError(oError);
					floorPendingTable.setBusy(false);
				}
			});

		},

		_destroyTab: function (key) {
			//this.byId("idWorklistFooter").setVisible(true);
			this.byId("page").setShowFooter(true);
			this.byId("btnStatusInfo").setVisible(false);
			var tabFilter = this.byId("destroyTab");
			var oDeviceData = this.getModel("device").getData(),
				oDevice = oDeviceData.system.phone,
				oLabel = this.getView().byId("idDonateAllLbl");

			// if (oDevice) {
			// 	oLabel.addStyleClass("donateAllMob");
			// } else {
			// 	oLabel.addStyleClass("donateAllDesk");
			// }

			// var labelModel = this.getModel("labelModel");
			var labelModel = this.getOwnerComponent().getModel();
			var controller = this;

			this.getOwnerComponent().googleAnalyticUpdate({
				page: "Destroy",
				site: this.siteId
			}); //Google Analytics

			// var donateAllSwitch = this.getView().byId("idSelectAllSwitch");
			var completeBtn = this.getView().byId("idCompleteBtn");
			var rejectBtn = this.getView().byId("idRejectBtn");
			var donateBtn = this.getView().byId("idDonateBtn");
			var desRefreshBtn = this.getView().byId("idDestroyRefresh");
			// donateAllSwitch.setState(false); //Donate All
			// donateAllSwitch.setEnabled(false); //Donate All
			rejectBtn.setEnabled(false);
			rejectBtn.setVisible(true);
			donateBtn.setEnabled(false);
			donateBtn.setVisible(true);
			completeBtn.setEnabled(false);
			completeBtn.setVisible(true);
			if (!sap.ui.Device.system.phone) {
				desRefreshBtn.setVisible(true);
			}else{
				this.getView().byId("idFooter1").setVisible(false);
				this.getView().byId("idFooter2").setVisible(true);
			}
			if (!tabFilter.data("loaded")) {
				var __content__ = sap.ui.xmlfragment("destroy", "YRTV_ONE_TILE.YRTV_ONE_TILE.view.Worklist.DestroyTabFilter", this);
				if ($.isArray(__content__)) {
					__content__.reverse().forEach(function (item, i) {
						tabFilter.insertContent(item, 0);
					});
				} else {
					tabFilter.insertContent(__content__, 0);
				}

				var pendingScanLabelNumber = sap.ui.getCore().byId("destroy--PendingScanLabelNumber");

				var labelNumberDelegate = {
					onAfterRendering: function () {
						var labelNum = this.getBindingContext("DestroyModel").getObject().LABEL_NUM;

						this.removeStyleClass("redLabelWorklist");
						this.removeStyleClass("yellowLabelWorklist");
						this.removeStyleClass("greenLabelWorklist");
						this.removeStyleClass("whiteLabelWorklist");

						if (labelNum.indexOf('98181') === 0) {
							this.addStyleClass('redLabelWorklist');
						} else if (labelNum.indexOf('98182') === 0) {
							this.addStyleClass('yellowLabelWorklist');
						} else if (labelNum.indexOf('98183') === 0) {
							this.addStyleClass('greenLabelWorklist');
						}
						if (labelNum.indexOf('98184') === 0) {
							this.addStyleClass('whiteLabelWorklist');
						}
					}
				};

				pendingScanLabelNumber.addDelegate(labelNumberDelegate, false, pendingScanLabelNumber, true);

				var oScanField = sap.ui.getCore().byId("destroy--idDestroySearchFld"),
					oSId = oScanField.getId();
				this.onScanField(oSId);

				jQuery.when(this.oCountLoadFinishedDeferred).then(jQuery.proxy(function () {

					var systemDate = this.getView().getModel("DestroyModel").getData().Count.SYSTEM_DATE;
					var todayAsInt = Date.parse(systemDate);

					var scannedLabelDueDate = sap.ui.getCore().byId("destroy--ScannedLabelDueDate");
					var pendingScanLabelDueDate = sap.ui.getCore().byId("destroy--PendingScanLabelDueDate");

					var dueDateDelegate = {
						onAfterRendering: function () {
							var dueDate = this.getBindingContext("DestroyModel").getObject().DUE_DATE;
							var bLength = dueDate.length;
							var bDate;
							if (bLength === 10) {
								bDate = dueDate.slice(5, 7) + "/" + dueDate.slice(8, 10) + "/" + dueDate.slice(0, 4);
							} else {
								bDate = dueDate.slice(4, 6) + "/" + dueDate.slice(6, 8) + "/" + dueDate.slice(0, 4);
							}
							var aDueDate = new Date(bDate);
							var oToday = new Date();
							if (aDueDate <= oToday) {
								// if (Date.parse(dueDate) <= todayAsInt) {
								if (!this.hasStyleClass('dueDateColor')) {
									this.addStyleClass('dueDateColor');
								}
							} else {
								this.removeStyleClass("dueDateColor");
							}
						}
					};

					// scannedLabelDueDate.addDelegate(dueDateDelegate, false, scannedLabelDueDate, true);
					// pendingScanLabelDueDate.addDelegate(dueDateDelegate, false, pendingScanLabelDueDate, true);

				}, this));

				tabFilter.data("loaded", "X");
				//Also ensure that any rows we HAVE loaded will have delegate applied
				var oTable = sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable");
				for (var a = 0; a < oTable.getItems().length; a++) {
					var labelNum = oTable.getItems()[a].getBindingContext("DestroyModel").getObject().LABEL_NUM;
					oTable.getItems()[a].getCells()[0].removeStyleClass("redLabelWorklist");
					oTable.getItems()[a].getCells()[0].removeStyleClass("yellowLabelWorklist");
					oTable.getItems()[a].getCells()[0].removeStyleClass("greenLabelWorklist");
					oTable.getItems()[a].getCells()[0].removeStyleClass("whiteLabelWorklist");
					if (labelNum.indexOf('98181') === 0) {
						oTable.getItems()[a].getCells()[0].addStyleClass('redLabelWorklist');
					} else if (labelNum.indexOf('98182') === 0) {
						oTable.getItems()[a].getCells()[0].addStyleClass('yellowLabelWorklist');
					} else if (labelNum.indexOf('98183') === 0) {
						oTable.getItems()[a].getCells()[0].addStyleClass('greenLabelWorklist');
					}
					if (labelNum.indexOf('98184') === 0) {
						oTable.getItems()[a].getCells()[0].addStyleClass('whiteLabelWorklist');
					}
				}
				
				if(sap.ui.Device.system.phone){
					//DESTROY
					var bundle = this.getResourceBundle();
					sap.ui.getCore().byId("destroy--destroyLabel").setText(bundle.getText("selectAll"));
				}
				
			}
			sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable").removeSelections(true);
			
			if (window.skipFirstLoad){
				return;
			}
			else if (!this.refreshTimestampElapsed()){
				return;
			}

			//Filters for Destroy
			var oFilters = [
				new sap.ui.model.Filter("WERKS", "EQ", this.siteId),
				new sap.ui.model.Filter("APP_SRC", "EQ", "DESTROY")
			];

			var destroyModel = this.getModel("DestroyModel");
			var floorModel = this.getModel("FloorModel");
			var vendorModel = this.getModel("VendorModel");
			var destroyPendingTable = sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable");
			this.getView().setBusy(true);
			var that = this;
			
			destroyPendingTable.setBusy(true);
			destroyPendingTable.setBusyIndicatorDelay(0);
			labelModel.read("/WLLabelSet", {
				filters: oFilters,
				success: function (oData) {
					sap.ui.core.BusyIndicator.hide();
					if (oData.results.length > 0) {
						that.siteId = oData.results[0].WERKS;
					}
					destroyPendingTable.setBusy(false);
					destroyModel.setProperty("/PendingScanList", oData.results);
					destroyModel.setProperty("/ScannedLabelsList", []);
					// sap.ui.getCore().byId("destroy--idDestroySearchFld").setValue("");
					// sap.ui.getCore().byId("destroy--idDestroySearchFld").focus();
					that.onVKeypadHide();
					that.getView().setBusy(false);
				},
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
					destroyPendingTable.setBusy(false);
					that.serviceError(oError);
					that.getView().setBusy(false);
				}
			});

		},
		onBeforeRendering: function () {
			// console.log("on before rendering");
		},
		_vendorTab: function () {

			// var vendorModel = this.getView().getModel("VendorModel");
			// if (vendorModel.getData().VendorList.length) {
			// 	vendorModel.getData().VendorList = [];
			// }
			// var vendorList = vendorModel.getData().VendorList;
			// // var labelModel = this.getModel("labelModel");
			// var labelModel = this.getOwnerComponent().getModel();
			// var controller = this;
			// vendorList.RTVLabel = [];
			// vendorList.pendingScan = [];
			// vendorList.scanLabels = [];
			// var vendorTable = this.getView().byId("idVendorTable");
			// var oFilters = [
			// 	new sap.ui.model.Filter("WERKS", "EQ", this.siteId),
			// 	new sap.ui.model.Filter("APP_SRC", "EQ", "VENDOR")
			// ];

		},

		onNavBack: function () {
			var floorModelData = this.getModel("FloorModel").getData();
			var destroyModelData = this.getModel("DestroyModel").getData();
			var oTable = sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable");
			var sKey = this.byId("idWorklistTabBar").getSelectedKey();
			if ((sKey === "floor" && floorModelData.ScannedLabelsList.length > 0) || (sKey === "destroy" && oTable.getSelectedItems().length >
					0)) {
				var that = this;
				var dialog = new sap.m.Dialog({
					title: __controller__.getResourceBundle().getText('Warning'),
					type: 'Message',
					state: 'Warning',
					content: new Text({
						text: this.getResourceBundle().getText("AreYouSureYouWantToExit")
					}),
					beginButton: new Button({
						text: __controller__.getResourceBundle().getText('YES'),
						press: function () {

							var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
							oCrossAppNavigator.toExternal({
								target: {
									semanticObject: "#"
								}
							});
							dialog.close();
						}
					}),
					endButton: new Button({
						text: __controller__.getResourceBundle().getText('CANCEL'),
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});
				dialog.open();
			} else {
				// var floorTabFilter = this.byId("floorTab");
				// floorTabFilter.destroyContent();
				// var destroyTabFilter = this.byId("destroyTab");
				// destroyTabFilter.destroyContent();

				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "#"
					}
				});
			}
		},

		onVendorTabSelect: function (evt) {
			this.loadCounter();
			var selectedKey = evt.getParameters().selectedKey;
			if (selectedKey == "Schedule" && sap.ui.Device.system.phone) {
				this.getView().byId('vbox0').setVisible(true);
				this.getView().byId('vbox0_1617304239567').setVisible(false);
			} else {
				this.getView().byId('vbox0').setVisible(false);
				this.getView().byId('vbox0_1617304239567').setVisible(true);
			}
		},

		onTabSelect: function (evt) {
			this.loadCounter();
			var selectedKey = evt.getParameters().selectedKey;
			if (selectedKey == "awaiting" && sap.ui.Device.system.phone)
				this.getView().byId('btnStatusInfo').setVisible(true);
			else
				this.getView().byId('btnStatusInfo').setVisible(false);

			if (window.location.hash.search("#YSO_RTV2-display") !== -1) {
				window.location.hash = "#YSO_RTV2-display&/tab/" + selectedKey;
			} else {
				window.location.hash = "#/tab/" + selectedKey;
			}

		},
		awaitingListStatusIcon: function (status) {
			switch (status) {
			case this.getView().getModel("WorkListi18n").getResourceBundle().getText("infoT1"):
				return "sap-icon://accept";
			case this.getView().getModel("WorkListi18n").getResourceBundle().getText("infoT2"):
				return "sap-icon://decline";
			case this.getView().getModel("WorkListi18n").getResourceBundle().getText("infoT3"):
				return "sap-icon://pending";
			case this.getView().getModel("WorkListi18n").getResourceBundle().getText("infoT4"):
				return "sap-icon://collections-insight";
				// case "Partially transmitted":
				// 	return "sap-icon://lateness";
			default:
				return "sap-icon://email";
			}
		},
		awaitingListStatusColor: function (status) {
			switch (status) {
			case this.getView().getModel("WorkListi18n").getResourceBundle().getText("infoT1"):
				return "Accept";
			case this.getView().getModel("WorkListi18n").getResourceBundle().getText("infoT2"):
				return "Reject";
			case this.getView().getModel("WorkListi18n").getResourceBundle().getText("infoT3"):
				return "Emphasized";
			case this.getView().getModel("WorkListi18n").getResourceBundle().getText("infoT4"):
				return "Emphasized";
				// case "Partially transmitted":
				// 	return "Emphasized";
			default:
				return "Reject";
			}
		},

		awaitingListStatusTooltipText: function (status) {
			if (status == "") return this.getView().getModel("WorkListi18n").getResourceBundle().getText("infoT6");
			else return status;
		},
		onTabSelect_hash: function (selectedKey) {
			this.getView().byId("idWorklistTabBar").setSelectedKey(selectedKey);
			var completeBtn = this.getView().byId('idCompleteBtn');
			// var donateAllLbl = this.getView().byId('idDonateAllLbl');
			var refreshBtn = this.getView().byId('idRefreshBtn');
			var refreshBtnVen = this.getView().byId('idRefreshBtnVen');
			// var selectAllSwitch = this.getView().byId('idSelectAllSwitch');
			var rejectBtn = this.getView().byId("idRejectBtn");
			var desRefreshBtn = this.getView().byId("idDestroyRefresh");
			var donateBtn = this.getView().byId("idDonateBtn");
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				oTab = this.getView().byId("vendorTab"),
				oData = oAuthModel.getData();

			this._sGetSelectedTab = selectedKey;
			if (selectedKey === "floor") {

				if (oData.results) {
					completeBtn.setVisible(
						oData.results.some(function (item) {
							return (item.Floor === "Y");
						})
					);
				}
				/*printAllLbl.setVisible(true); Uncomment when activating PrintAll functionality*/
				// selectAllSwitch.setVisible(false); //Make true when activating PrintAll functionality on Floor
				// donateAllLbl.setVisible(false);
				rejectBtn.setVisible(false);
				refreshBtn.setVisible(false);
				refreshBtnVen.setVisible(false);
				donateBtn.setVisible(false);
				desRefreshBtn.setVisible(false);
				this.getView().byId("idDonateBtn").setEnabled(false);
				this._floorTab(selectedKey);

			} else if (selectedKey === "destroy") {
				donateBtn.setVisible(true);
				refreshBtn.setVisible(false);
				refreshBtnVen.setVisible(false);
				//Unless this is the INIT call, OR the first navigation for the user, we should reload the page
				//This will be done in the _destroyTab logic
				this._destroyTab(selectedKey);

			} else if (selectedKey === "awaiting") {
				// this.refreshAwaitingData();
				refreshBtn.setVisible(true);
				refreshBtnVen.setVisible(false);
				rejectBtn.setVisible(false);
				completeBtn.setVisible(false);
				donateBtn.setVisible(false);
				desRefreshBtn.setVisible(false);
				this.getView().byId("idDonateBtn").setEnabled(false);
				if (sap.ui.Device.system.phone) {
					//this.getView().byId("idWorklistFooter").setVisible(false);
					this.byId("page").setShowFooter(true);
					this.getView().byId("idFooter1").setVisible(true);
					this.getView().byId("idFooter2").setVisible(false);
					refreshBtn.setVisible(true);
				}
				//Unless this is the INIT call, OR the first navigation for the user, we should reload the page
				if (!window.skipFirstLoad){
					if (this.refreshTimestampElapsed()){
						this.onRefreshPress();
					}
				}
				// donateAllLbl.setVisible(false);
				// selectAllSwitch.setVisible(false);
			} else if (selectedKey === "vendor") {
				refreshBtn.setVisible(false);
				refreshBtnVen.setVisible(true);
				completeBtn.setVisible(false);
				donateBtn.setVisible(false);
				desRefreshBtn.setVisible(false);
				/*printAllLbl.setVisible(false); Uncomment when activating PrintAll functionality*/
				// donateAllLbl.setVisible(false);
				rejectBtn.setVisible(false);
				this.getView().byId("idDonateBtn").setEnabled(false);
				if (sap.ui.Device.system.phone) {
					//	this.getView().byId("idWorklistFooter").setVisible(false);
					this.byId("page").setShowFooter(false);
				}
				// selectAllSwitch.setVisible(false);
				jQuery.sap.delayedCall(1000, this, function () {
					oTab.focus();
				});
				//Unless this is the INIT call, OR the first navigation for the user, we should reload the page
				if (!window.skipFirstLoad){
					if (this.refreshTimestampElapsed()){
						this.onRefreshPress();
					}
				}
				this._vendorTab(selectedKey);
			} else {
				refreshBtn.setVisible(true);
				refreshBtnVen.setVisible(false);
				completeBtn.setVisible(false);
				donateBtn.setVisible(false);
				desRefreshBtn.setVisible(false);
				/*printAllLbl.setVisible(false); Uncomment when activating PrintAll functionality*/
				// donateAllLbl.setVisible(false);
				rejectBtn.setVisible(false);
				// selectAllSwitch.setVisible(false);
			}
			window.skipFirstLoad = null;
			
		},

		onRefreshPress: function () {
			if (this._sGetSelectedTab === "destroy") {
				var destroyModel = this.getModel("DestroyModel");
				var oTable = sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable");
				sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable").removeSelections(true);
				this._destroyTab("destroy");
				destroyModel.updateBindings(true);
				destroyModel.refresh(true);
				oTable.getBinding("items").refresh(true);
				//loop the table and make the label color code 
				for (var a = 0; a < oTable.getItems().length; a++) {
					var labelNum = oTable.getItems()[a].getBindingContext("DestroyModel").getObject().LABEL_NUM;
					oTable.getItems()[a].getCells()[0].removeStyleClass("redLabelWorklist");
					oTable.getItems()[a].getCells()[0].removeStyleClass("yellowLabelWorklist");
					oTable.getItems()[a].getCells()[0].removeStyleClass("greenLabelWorklist");
					oTable.getItems()[a].getCells()[0].removeStyleClass("whiteLabelWorklist");
					if (labelNum.indexOf('98181') === 0) {
						oTable.getItems()[a].getCells()[0].addStyleClass('redLabelWorklist');
					} else if (labelNum.indexOf('98182') === 0) {
						oTable.getItems()[a].getCells()[0].addStyleClass('yellowLabelWorklist');
					} else if (labelNum.indexOf('98183') === 0) {
						oTable.getItems()[a].getCells()[0].addStyleClass('greenLabelWorklist');
					}
					if (labelNum.indexOf('98184') === 0) {
						oTable.getItems()[a].getCells()[0].addStyleClass('whiteLabelWorklist');
					}
				}
				sap.ui.getCore().byId("destroy--idDestroyScroll").scrollTo(0,0);
			}
			else if (this._sGetSelectedTab === "awaiting") {
				this.byId("AwaitingTables").getBinding("items").refresh();
				this.byId("AwaitingTables").getParent().getParent().focus(this.byId("AwaitingTables").getItems()[0]);
				this.byId("awaitingScroll").scrollTo(0,0);
				
			}
			else {
				if(this.byId("idVendorScheduleShipmentTable").getBinding("items")){
					this.byId("idVendorScheduleShipmentTable").getBinding("items").refresh();
				}
				if(this.byId("idVendorReadyToShipTable").getBinding("items")){
					this.byId("idVendorReadyToShipTable").getBinding("items").refresh();
				}
				//this.byId("awaitingScroll").scrollTo(0,0);
				this.byId("vendorScroll").scrollTo(0, 0);
				this.byId("readyScroll").scrollTo(0, 0);
			}
		},

		onCheckPrintLabel: function (oEvent) {
			var hbox = oEvent.getSource().getParent();
			var icon = hbox.getItems()[1];
			if (oEvent.getParameter("selected") === true) {
				icon.setColor("red");
			} else {
				icon.setColor("");
			}
		},

		onDonateAllPress: function (evt) {
			var scannedLabelsTable = sap.ui.getCore().byId('destroy--idDestroyScannedTable');
			if (evt.getSource().getText() === "Donate All") {
				for (var i = 0; i < scannedLabelsTable.getItems().length; i++) {
					scannedLabelsTable.getItems()[i].getCells()[5].setState(true);
				}
			}
		},
		onColorLiveChange: function (evt) {

		},

		onLabelScan: function (oEvent) {
			var sValue = oEvent.getSource().getValue();
			if (sValue.length >= 17) {
				this.onSearchLabel(oEvent);
			}

		},

		onSearchLabel: function (oEvent) {

			var sQuery = oEvent.getSource().getValue();

			var sId = oEvent.getSource().getId();
			if (oEvent.getParameter("query") !== undefined) {
				sQuery = (oEvent.getParameter("query")).trim();
				sId = oEvent.getParameter("id");
			} else {
				sQuery = (oEvent.getSource().getValue()).trim();
				sId = oEvent.getSource().getId();
			}

			if (sQuery === "") {
				return;
			}

			var regExp = /^[9][8][1][8][1-4][0-9]{12}$/;

			oEvent.getSource().setValue("");

			if (sId === "floor--idFloorSearchFld") {
				if (regExp.test(sQuery)) {
					this._applyRTVLabelSearch(sQuery);
				} else {
					this.onMessageDialog("error", this.getResourceBundle().getText("validRTVMsg"), this);
				}
			} else if (sId === "destroy--idDestroySearchFld") {
				if (regExp.test(sQuery)) {
					this._applyRTVDestroyLabelSearch(sQuery);
				} else {
					this.onMessageDialog("error", this.getResourceBundle().getText("validRTVMsg"), this);
				}
			}
		},

		onRemoveFloorScannedLabel: function (oEvent) {
			this._removeFloorScannedLabel(oEvent, "FloorModel");
			var floorModelData = this.getView().getModel("FloorModel").getData();
			// var selectAllSwitch = this.getView().byId("idSelectAllSwitch");
			var completeBtn = this.getView().byId("idCompleteBtn");
			if (floorModelData.ScannedLabelsList.length === 0) {
				// selectAllSwitch.setState(false);
				// selectAllSwitch.setEnabled(false);
				completeBtn.setEnabled(false);
			}

		},

		onRemoveDestroyScannedLabel: function (oEvent) {
			this._removeFloorScannedLabel(oEvent, "DestroyModel");

			var destroyModelData = this.getView().getModel("DestroyModel").getData();
			var donateAllSwitch = this.getView().byId("idSelectAllSwitch");
			var completeBtn = this.getView().byId("idCompleteBtn");
			var rejectBtn = this.getView().byId("idRejectBtn");
			if (destroyModelData.ScannedLabelsList.length === 0) {
				donateAllSwitch.setState(false);
				donateAllSwitch.setEnabled(false);
				completeBtn.setEnabled(false);
				rejectBtn.setEnabled(false);
				this.getView().byId("idDonateBtn").setEnabled(false);
			}

		},

		_removeFloorScannedLabel: function (oEvent, model) {

			var index = oEvent.getParameter("listItem").getBindingContext(model).getPath().split("/")[2];
			var modelData = this.getModel(model).getData();
			modelData.PendingScanList = modelData.PendingScanList.concat(modelData.ScannedLabelsList.splice(index, 1));
			this.getModel(model).checkUpdate(true);
			oEvent.getSource().rerender();
			return;
		},

		onCompletePress: function (oEvent) {

			sap.ui.core.BusyIndicator.show();
			var sKey = this.byId("idWorklistTabBar").getSelectedKey();
			// var oModel = this.getModel("labelModel");
			var oModel = this.getOwnerComponent().getModel();
			// var selectAllSwitch = this.getView().byId("idSelectAllSwitch");
			var completeBtn = this.getView().byId("idCompleteBtn");
			var that = this;
			var infoMsg = [],
				errorMsg = [];
			this.loadCounter();
			if (sKey === "floor") {
				var floorModel = this.getModel("FloorModel");
				var scannedLabelNum = new JSONModel({
					WERKS: this.siteId,
					APP_SRC: "FLOOR",
					ACTION: "COMPLETE",
					labelheaderset: []
				});
				if (floorModel.getData().ScannedLabelsList.length > 0) {
					for (var i = 0; i < floorModel.getData().ScannedLabelsList.length; i++) {
						scannedLabelNum.getData().labelheaderset.push({
							LABEL_NUM: floorModel.getData().ScannedLabelsList[i].LABEL_NUM
						});
					}
					oModel.create("/WLHeaderSet", scannedLabelNum.getData(), {
						success: function (odata, response) {
							floorModel.setProperty("/ScannedLabelsList", []);
							// selectAllSwitch.setEnabled(false);
							// selectAllSwitch.setState(false);
							completeBtn.setEnabled(false);
							that.getView().setBusy(false);
							that._floorTab();
							var oMsg = odata.APP_SRC + " " + odata.ACTION;
							MessageToast.show(oMsg);
							return;
						},
						error: function (response) {
							sap.ui.core.BusyIndicator.hide();
							that.getView().setBusy(false);
							if (response.responseText.indexOf('{"') !== -1) {
								var errorResponse = JSON.parse(response.responseText);
								var respMsg = errorResponse.error.innererror;

								for (var k = 0; k < respMsg.errordetails.length; k++) {
									if (respMsg.errordetails[k].severity === "error" && respMsg.errordetails[k].code.indexOf("IWBEP") === -1 && respMsg.errordetails[
											k].message !== "") {
										errorMsg.push(errorMsg.length + 1 + ". " + respMsg.errordetails[k].message + '\n');
									} else if (respMsg.errordetails[k].severity === "info") {
										if (infoMsg.length === 0) {
											infoMsg.push(that.getResourceBundle().getText("infoMsgP1") + '\n');
											infoMsg.push('\n' + infoMsg.length + ". " + respMsg.errordetails[k].message + '\n');
										} else {
											infoMsg.push(infoMsg.length + ". " + respMsg.errordetails[k].message + '\n');
										}
									}
								}
								if (errorMsg.length > 0) {
									var message = (errorMsg.toString()).replace(/,/g, " ");
									sap.m.MessageBox.error(
										message, {
											actions: [MessageBox.Action.OK],
											onClose: function () {
												floorModel.setProperty("/ScannedLabelsList", []);
												// selectAllSwitch.setEnabled(false);
												// selectAllSwitch.setState(false);
												completeBtn.setEnabled(false);
												that._floorTab();
												infoMsg = [];
												errorMsg = [];
											}
										}
									);
								}
								if (infoMsg.length > 0) {
									infoMsg.push('\n' + that.getResourceBundle().getText("infoMsgP2"));
									that.onMessageDialog("info", (infoMsg.toString()).replace(/,/g, " "), that);
								}
							}
						}
					});
				}
			} else if (sKey === "destroy") {
				//Destroy complete action logic
				var destroyModel = this.getModel("DestroyModel");
				var destroyModelData = destroyModel.getData();
				var payload = {
					WERKS: this.siteId,
					APP_SRC: "DESTROY",
					ACTION: "COMPLETE",
					labelheaderset: []
				};
				var oButton = oEvent.getSource().getId();
				var sFlag = "";
				var sRowSelected = sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable").getSelectedItems();

				// Pass Flag = X only when donate button is pressed
				if (oButton.includes("idDonateBtn")) {
					sFlag = "X";
				}
				for (var j = 0; j < sRowSelected.length; j++) {
					var sPath = sRowSelected[j].getBindingContextPath();
					payload.labelheaderset.push({
						LABEL_NUM: destroyModel.getProperty(sPath).LABEL_NUM,
						FLAG: sFlag
					});
				}
				oModel.create("/WLHeaderSet", payload, {
					success: function (odata, response) {
						that.getView().setBusy(false);
						destroyModel.setProperty("/ScannedLabelsList", []);

						that._destroyTab();
						// var oMsg = odata.APP_SRC + " " + odata.ACTION;
						var oMsg;
						if(sFlag === ""){
							oMsg = that.getResourceBundle().getText("destroyComp");
						}else oMsg = that.getResourceBundle().getText("donateComp");
						
						MessageToast.show(oMsg);
						sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable").removeSelections(true);
						return;
					},
					error: function (response) {
						sap.ui.core.BusyIndicator.hide();
						sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable").removeSelections(true);
						if (response.responseText.indexOf('{"') !== -1) {
							var errorResponse = JSON.parse(response.responseText);
							var respMsg = errorResponse.error.innererror;

							for (var k = 0; k < respMsg.errordetails.length; k++) {
								if (respMsg.errordetails[k].severity === "error" && respMsg.errordetails[k].code.indexOf("IWBEP") === -1 && respMsg.errordetails[
										k].message !== "") {
									errorMsg.push(errorMsg.length + 1 + ". " + respMsg.errordetails[k].message + '\n');
								} else if (respMsg.errordetails[k].severity === "info") {
									if (infoMsg.length === 0) {
										infoMsg.push(that.getResourceBundle().getText("infoMsgP1") + '\n');
										infoMsg.push('\n' + infoMsg.length + ". " + respMsg.errordetails[k].message + '\n');
									} else {
										infoMsg.push(infoMsg.length + ". " + respMsg.errordetails[k].message + '\n');
									}
								}
							}
							if (errorMsg.length > 0) {
								var message = (errorMsg.toString()).replace(/,/g, " ");
								sap.m.MessageBox.error(
									message, {
										actions: [MessageBox.Action.OK],
										onClose: function () {
											destroyModel.setProperty("/ScannedLabelsList", []);
											that._destroyTab();
											infoMsg = [];
											errorMsg = [];
										}
									}
								);
							}
							if (infoMsg.length > 0) {
								infoMsg.push('\n' + that.getResourceBundle().getText("infoMsgP2"));
								that.onMessageDialog("info", (infoMsg.toString()).replace(/,/g, " "), that);
							}
						}
					}
				});

			}
		},

		onRTVDetail: function (oEvent) {
			var oTable = sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable");
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				var destroyModelData = this.getModel("DestroyModel").getData();
				var floorModelData = this.getModel("FloorModel").getData();
				jQuery.sap.require("jquery.sap.storage");
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session);
				oStorage.put("rtvNavBack", window.location.href);
				if (floorModelData.ScannedLabelsList.length > 0 || oTable.getSelectedItems().length > 0) {
					this.RTVLabel = oEvent.getSource().getText();
					var dialog = new Dialog({
						title: __controller__.getResourceBundle().getText('Warning'),
						type: 'Message',
						state: 'Warning',
						content: new Text({
							text: this.getResourceBundle().getText("toViewRTV")
						}),
						beginButton: new Button({
							text: __controller__.getResourceBundle().getText('YES'),
							press: function () {
								dialog.close();
								var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
								var action = "display&/object/" + this.siteId + "/" + this.RTVLabel + "";
								oCrossAppNavigator.toExternal({
									target: {
										semanticObject: "YSO_VIEWRTV",
										action: action
									}
								});
							}.bind(this)
						}),
						endButton: new Button({
							text: __controller__.getResourceBundle().getText('CANCEL'),
							press: function () {
								dialog.close();
							}
						}),
						afterClose: function () {
							dialog.destroy();
						}
					});
					dialog.open();
				} else {
					var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
					var storid = this.siteId;
					var RTVLabel = oEvent.getSource().getText();
					var action = "display&/object/" + storid + "/" + RTVLabel + "";
					oCrossAppNavigator.toExternal({
						target: {
							semanticObject: "YSO_VIEWRTV",
							action: action
						}
					});
				}
			} else {

			}
		},
		//Must be called when navigating away from this application. Destroys shipment and readytoship dialog fragments
		//as well as all items. This is important becuase we add DELEGATES to these items, which means they persist until
		//individually destroyed
		destroyDialogs: function () {
			if (this._oShipmentDialog) {
				this._oShipmentDialog.destroy(true);
				delete this._oShipmentDialog;
			}
			if (this.byId("CreateShipmentLabelNumber")) {
				this.byId("CreateShipmentLabelNumber").destroy();
				this.byId("matTxt").destroy();
				this.byId("makTxt").destroy();
				this.byId("mengeTxt").destroy();
				this.byId("costTxt").destroy();
				this.byId("rgaTxt").destroy();
				this.byId("addrTxt").destroy();
				this.byId("pstlTxt").destroy();
			}
			if (this.ReadyToShipmentDetailDialog) {
				this.ReadyToShipmentDetailDialog.destroy(true);
				delete this.ReadyToShipmentDetailDialog;
			}
			if (this.byId("ReadyLabelNumber")) {
				this.byId("ReadyLabelNumber").destroy();
				this.byId("matTxtR").destroy();
				this.byId("makTxtR").destroy();
				this.byId("mengeTxtR").destroy();
				this.byId("costTxtR").destroy();
				this.byId("rgaTxtR").destroy();
				this.byId("addrTxtR").destroy();
				this.byId("pstlTxtR").destroy();
			}
		},

		onRTVDetailReady: function (oEvent) {

			window.navType = "RDY";
			this.onRTVDetailVendor(oEvent);

		},

		onRTVDetailBuild: function (oEvent) {

			window.navType = "BLD";
			this.onRTVDetailVendor(oEvent);

		},

		onRTVDetailVendor: function (oEvent) {

			var label = oEvent.getSource().getProperty("text");
			this.RTVLabel = label;
			var that = this;

			var dialog = new Dialog({
				title: __controller__.getResourceBundle().getText('Warning'),
				type: 'Message',
				state: 'Warning',
				content: new Text({
					text: this.getResourceBundle().getText("toViewRTV")
				}),
				beginButton: new Button({
					text: __controller__.getResourceBundle().getText('YES'),
					press: function () {
						dialog.close();
						var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
						var action = "display&/object/" + this.siteId + "/" + this.RTVLabel + "";
						//that.ReadyToShipmentDetailDialog.destroy();
						oCrossAppNavigator.toExternal({
							target: {
								semanticObject: "YSO_VIEWRTV",
								action: action
							}
						});

					}.bind(this)
				}),
				endButton: new Button({
					text: __controller__.getResourceBundle().getText('CANCEL'),
					press: function () {
						window.navType = null;
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
					if (window.navType) {
						that.destroyDialogs();
					}
				}
			});
			dialog.open();

		},

		onArticleDetail: function (oEvent) {
			var destroyModelData = this.getModel("DestroyModel").getData();
			var oTable = sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable");
			var floorModelData = this.getModel("FloorModel").getData();
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				if (floorModelData.ScannedLabelsList.length > 0 || oTable.getSelectedItems().length > 0) {
					this.article = oEvent.getSource().getText();
					var dialog = new Dialog({
						title: __controller__.getResourceBundle().getText('Warning'),
						type: 'Message',
						state: 'Warning',
						content: new Text({
							text: this.getResourceBundle().getText("toALU")
						}),
						beginButton: new Button({
							text: __controller__.getResourceBundle().getText('YES'),
							press: function () {
								dialog.close();
								var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
								var action = "Y_LOOKUP&/product/" + this.siteId + "/00000000" + this.article + "";
								oCrossAppNavigator.toExternal({
									target: {
										semanticObject: "Article",
										action: action
									}
								});
							}.bind(this)
						}),
						endButton: new Button({
							text: __controller__.getResourceBundle().getText('CANCEL'),
							press: function () {
								dialog.close();
							}
						}),
						afterClose: function () {
							dialog.destroy();
						}
					});
					dialog.open();
				} else {
					var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
					var storid = this.siteId;
					var article = oEvent.getSource().getText();
					var action = "Y_LOOKUP&/product/" + storid + "/00000000" + article + "";
					oCrossAppNavigator.toExternal({
						target: {
							semanticObject: "Article",
							action: action
						}
					});
				}
			} else {
				//alert("App to app navigation is not supported in this mode");
			}
		},

		onArticleDetailScan: function (oEvent) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				this.article = oEvent.getSource().getText();
				var dialog = new Dialog({
					title: __controller__.getResourceBundle().getText('Warning'),
					type: 'Message',
					state: 'Warning',
					content: new Text({
						text: this.getResourceBundle().getText("toALU")
					}),
					beginButton: new Button({
						text: __controller__.getResourceBundle().getText('YES'),
						press: function () {
							dialog.close();
							var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
							var action = "Y_LOOKUP&/product/" + this.siteId + "/00000000" + this.article + "";
							oCrossAppNavigator.toExternal({
								target: {
									semanticObject: "Article",
									action: action
								}
							});
						}.bind(this)
					}),
					endButton: new Button({
						text: __controller__.getResourceBundle().getText('CANCEL'),
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});
				dialog.open();
			} else {
				//alert("App to app navigation is not supported in this mode");
			}
		},

		onRTVDetailScan: function (oEvent) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				jQuery.sap.require("jquery.sap.storage");
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session);
				oStorage.put("rtvNavBack", window.location.href);
				this.RTVLabel = oEvent.getSource().getText();
				var dialog = new Dialog({
					title: __controller__.getResourceBundle().getText('Warning'),
					type: 'Message',
					state: 'Warning',
					content: new Text({
						text: this.getResourceBundle().getText("toViewRTV")
					}),
					beginButton: new Button({
						text: __controller__.getResourceBundle().getText('YES'),
						press: function () {
							dialog.close();
							var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
							var action = "display&/object/" + this.siteId + "/" + this.RTVLabel + "";
							oCrossAppNavigator.toExternal({
								target: {
									semanticObject: "YSO_VIEWRTV",
									action: action
								}
							});
						}.bind(this)
					}),
					endButton: new Button({
						text: __controller__.getResourceBundle().getText('CANCEL'),
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});
				dialog.open();
			} else {
				//alert("App to app navigation is not supported in this mode");
			}
		},

		onMessageDialog: function (type, message, oController) {
			var sKey = oController.byId("idWorklistTabBar").getSelectedKey();
			if (type === "info") {
				sap.m.MessageBox.information(
					message, {
						actions: [MessageBox.Action.OK],
						onClose: function (oAction) {
							if (sKey === "floor") {
								// sap.ui.getCore().byId("floor--idFloorSearchFld").focus();
								oController.onVKeypadHide();
							} else if (sKey === "destroy") {
								// sap.ui.getCore().byId("destroy--idDestroySearchFld").focus();
								oController.onVKeypadHide();
							}
						}
					}
				);
			} else if (type === "error") {
				sap.m.MessageBox.error(
					message, {
						actions: [MessageBox.Action.OK],
						onClose: function (oAction) {
							if (sKey === "floor") {
								// sap.ui.getCore().byId("floor--idFloorSearchFld").focus();
								oController.onVKeypadHide();
							} else if (sKey === "destroy") {
								// sap.ui.getCore().byId("destroy--idDestroySearchFld").focus();
								oController.onVKeypadHide();
							}
						}
					}
				);
			}
		},

		toShipmentDetails: function (oEvent) {
			var dataObj = oEvent.getSource().getBindingContext('VendorModel').getObject();
			var shipmentID = dataObj.SHIP_ID;
			this.getRouter().navTo("shipmentDetails", {
				site: dataObj.WERKS,
				shipmentID: shipmentID //sPath
			});
		},

		onRejectPress: function (evt) {
			this.loadCounter();
			var destroyModel = this.getView().getModel("DestroyModel");
			var oTable = sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable").getSelectedItems();
			// var scannedLabelsList = destroyModel.getData().ScannedLabelsList;
			// var that = this;
			// for (var label = 0; label < scannedLabelsList.length; label++) {
			// 	if (scannedLabelsList[label].DONATE === true) {
			// 		sap.m.MessageBox.error(
			// 			that.getResourceBundle().getText("donateCanntBeApplied"), {
			// 				actions: [MessageBox.Action.OK]
			// 			}
			// 		);
			// 		return;
			// 	}
			// }

			if (oTable.length > 0) {
				this.callReject();
			}

		},

		callReject: function () {

			//Destroy Reject action logic

			var destroyModel = this.getModel("DestroyModel");
			var destroyModelData = destroyModel.getData();
			var payload = {
				WERKS: this.siteId,
				APP_SRC: "DESTROY",
				ACTION: "REJECT",
				labelheaderset: []
			};

			var sRowSelected = sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable").getSelectedItems();

			for (var j = 0; j < sRowSelected.length; j++) {
				var sPath = sRowSelected[j].getBindingContextPath();
				payload.labelheaderset.push({
					LABEL_NUM: destroyModel.getProperty(sPath).LABEL_NUM,
					FLAG: ""
				});
			}

			var oModel = this.getOwnerComponent().getModel();
			var infoMsg = [],
				errorMsg = [];
			var that = this;

			oModel.create("/WLHeaderSet", payload, {
				success: function (odata, response) {
					destroyModel.setProperty("/ScannedLabelsList", []);
					that._destroyTab();
					// var oMsg = odata.APP_SRC + " " + odata.ACTION;
					var oMsg = that.getResourceBundle().getText("destroyRej");
					sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable").removeSelections(true);
					MessageToast.show(oMsg);

					return;
				},
				error: function (response) {
					sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable").removeSelections(true);
					if (response.responseText.indexOf('{"') !== -1) {
						var errorResponse = JSON.parse(response.responseText);
						var respMsg = errorResponse.error.innererror.errordetails;
						var textMessageArray = [];
						respMsg.forEach(function (msg) {
							textMessageArray.push(new sap.m.Label({
								text: msg.message
							}));
						});
						var oMessageVBox = new sap.m.VBox({
							items: textMessageArray
						});
						var dialogErrorMessage = new Dialog({
							title: "Error",
							type: 'Message',
							state: 'Error',
							content: oMessageVBox,
							beginButton: new Button({
								text: "OK",
								press: function () {
									dialogErrorMessage.close();
								}
							}),
							afterClose: function () {
								dialogErrorMessage.destroy();
								destroyModel.setProperty("/ScannedLabelsList", []);
								that._destroyTab();
								infoMsg = [];
								errorMsg = [];
							}
						});

						dialogErrorMessage.open();

						if (errorMsg.length > 0) {
							var message = (errorMsg.toString()).replace(/,/g, " ");
							sap.m.MessageBox.error(
								message, {
									actions: [MessageBox.Action.OK],
									onClose: function () {
										destroyModel.setProperty("/ScannedLabelsList", []);
										that._destroyTab();
										infoMsg = [];
										errorMsg = [];
									}
								}
							);
						}
						if (infoMsg.length > 0) {
							infoMsg.push('\n' + that.getResourceBundle().getText("infoMsgP2"));
							that.onMessageDialog("info", (infoMsg.toString()).replace(/,/g, " "), that);
						}
					}
				}
			});

		},

		serviceError: function (oError) {
			sap.m.MessageBox.show(
				JSON.parse(oError.responseText).error.message.value, {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Error",
					actions: [sap.m.MessageBox.Action.OK],
					onClose: function (oAction) {
						var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
						oCrossAppNavigator.toExternal({
							target: {
								semanticObject: "#"
							}
						});
					}
				});
		},

		onAfterRendering: function () {
			
			var oModel = this.getOwnerComponent().getModel();
			
			window.that = this;
			if (this.getOwnerComponent()._message) {
				MessageToast.show(this.getOwnerComponent()._message);
			} else {
				this.getOwnerComponent()._message = null;
			}
			
			if (sap.ui.getCore().getConfiguration().getLanguage() === 'fr'
			&& sap.ui.Device.system.phone){
				var oDataTemplate = new sap.ui.core.CustomData();
				oDataTemplate.setKey("frenchPaddingLeft");
				oDataTemplate.setValue("80");
				oDataTemplate.setWriteToDom(true);
				this.byId("vendorTab").addCustomData(oDataTemplate);
			}
			
			//Navigated from a selected label (or other). Must navigate back to popup
			if (window.navType) {
				//Attach load complete event
				
				oModel.attachRequestCompleted(function (oEvent) {
					//Only run after loading readyToShip or BuildShipment 
					if (window.navType === "BLD") {
						window.navType = null;
						window.that.onPressOpenShipmentDialog(null);
						window.that = null;
					} else if (window.navType === "RDY" && oEvent.getSource().getData(window.sPath)) {
						window.navType = null;
						window.that.onPressReadyToShipDialog(null);
						window.that = null;
					}
				});
			}
			//Now attach another data model to handle count
			//Must set a delegate for each of our data tables. When they are loaded, we update the count based on the returned data
			window.awaitingTab = this.byId("awaitingTab");
			window.vendorTab = this.byId("vendorTab");
			window.destroyTab = this.byId("destroyTab");
			window.scheduleTab = this.byId("scheduleTab");
			window.readyTab = this.byId("readyTab");
			
			oModel.attachRequestCompleted(function(oEvent) {
				
				//Set awaiting count. Must first get index
				var countInd = oEvent.getParameter("response").responseText.indexOf("count\":\"");
				//Now get count number. Will never be more than 10 digits
				var countSlice = oEvent.getParameter("response").responseText.slice(countInd + 8, countInd + 18);
				countSlice = countSlice.slice(0, countSlice.indexOf("\","));
				
				if (isNaN(parseInt(countSlice, 10))){
					return;
				}
				
				if (oEvent.getParameter("url").indexOf("WLAwaitingSet") !== -1){
					window.awaitingTab.setCount(countSlice);
				}
				else if (oEvent.getParameter("url").indexOf("SCHEDULE_SHIPMENT_LISTSet") !== -1){
					window.scheduleTab.setCount(countSlice);
					window.vendorTab.setCount(parseInt(countSlice, 10) +  parseInt(window.readyTab.getCount(), 10));
				}
				else if (oEvent.getParameter("url").indexOf("READY_TO_SHIP_LISTSet") !== -1){
					window.readyTab.setCount(countSlice);
					window.vendorTab.setCount(parseInt(countSlice, 10) +  parseInt(window.scheduleTab.getCount(), 10));
				}
				else if (oEvent.getParameter("url").indexOf("WLLabelSet") !== -1){
					window.destroyTab.setCount(countSlice);
				}
			});
			
			//if we are NOT on destroy tab on rendering, we need to force a call to the destroy tab.
			//This is to update the count and initially load the table. 
			if (this.byId("idWorklistTabBar")._getIconTabHeader().getSelectedKey() !== "destroy"){

				//Filters for Destroy
				var oFilters = [
					new sap.ui.model.Filter("WERKS", "EQ", this.siteId),
					new sap.ui.model.Filter("APP_SRC", "EQ", "DESTROY")
				];
	
				var destroyModel = this.getModel("DestroyModel");
				var that = this;
				oModel.read("/WLLabelSet", {
					filters: oFilters,
					success: function (oData) {
						if (oData.results.length > 0) {
							that.siteId = oData.results[0].WERKS;
						}
						destroyModel.setProperty("/PendingScanList", oData.results);
						destroyModel.setProperty("/ScannedLabelsList", []);
					},
					error: function (oError) {
						sap.ui.core.BusyIndicator.hide();
						that.serviceError(oError);
					}
				});
			}
			
			//Finally, we want to avoid loading anything we navigate to for the first 10 seconds. 
			//This ensures we don't load data that we JUST loaded when opening the application.
			//Calling refresh will immediately clear this variable
			window.noRefreshTimestamp = new Date().getTime();
			//We will immediately call the tabSelect function. We want to ensure this function doesn't reload data the first time
			window.skipFirstLoad = true;

		},
		_AuthorizationAccess: function () {
			var oModel = this.getOwnerComponent().getModel();
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel");
			var that = this;
			sap.ui.core.BusyIndicator.show();
			oModel.read("/UserAuthSet", {
				success: function (oData, response) {
					oAuthModel.setData(oData);
					oAuthModel.setProperty("/Awaiting", oData.results[0].Awaiting);
					oAuthModel.setProperty("/Floor", oData.results[0].Floor);
					oAuthModel.setProperty("/Vendor", oData.results[0].Vendor);
					oAuthModel.setProperty("/Destroy", oData.results[0].Destroy);
					oAuthModel.refresh();
					sap.ui.core.BusyIndicator.hide();
					var i = window.location.hash.search("/tab/");
					var l = window.location.hash.length;
					that.onTabSelect_hash(window.location.hash.substring(i + 5, l));
					// that.onTabSelect_hash("awaiting");
				},
				error: function (oError) {

					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		_domainData: function (oEvent) {
			var oModel = this.getOwnerComponent().getModel();
			var oEmailDomain = this.getOwnerComponent().getModel("oEmailDomain");

			sap.ui.core.BusyIndicator.show();
			oModel.read("/Email_DomainSet", {
				success: function (oData, response) {
					oEmailDomain.setData(oData);
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {

					sap.ui.core.BusyIndicator.hide();
				}
			});

		},
		onUpdateStartedSCHEDULE_SHIPMENT_LISTSet: function () {
			// console.log("started Schedule");
		},
		onUpdateFinishedSCHEDULE_SHIPMENT_LISTSet: function () {
			// console.log("finished Schedule");
		},

		onChangeCOD: function () {
			var ShipmentDialogModel = this.getView().getModel("shipmentDialogModel");
			if (this.byId("shippingTerm") && this.byId("shippingTerm").getSelectedItem().getKey() === "C") {
				this.getView().byId("accountLabel").addStyleClass("label--required");
				this.getView().byId("account_box").setVisible(true);
			} else {
				this.getView().byId("accountLabel").removeStyleClass("label--required");
				if (this.getView().byId("carrier") && this.getView().byId("carrier").getSelectedKey() !== "OT") {
					this.getView().byId("account_box").setVisible(false);
				} else {
					this.getView().byId("account_box").setVisible(true);
				}
			}
			this.fetchCarrierList("LABEL_NUM", ShipmentDialogModel, this._oShipmentDialog, this.sLabelSelected, this.byId("shippingTerm").getSelectedItem()
				.getKey());
		},

		onPressOpenShipmentDialog: function (oEvent) {
			if (!this._oShipmentDialog) {
				this.createShipmentDialog();
			}
			var oView = this.getView();
			//Destroy dialogue model if using R model. 
			if (oView.getModel("shipmentDialogModelBackup")) {
				oView.setModel(oView.getModel("shipmentDialogModelBackup"), "shipmentDialogModel");
			}
			//reset the values
			this.resetValues();

			//Open the Shipment Dialog
			this._oShipmentDialog.open();
			if (oEvent) {
				var bindingContext = oEvent.getSource().getBindingContextPath();
				var selectedRowData = oEvent.getSource().getModel().getData(bindingContext);
				window.bindingContext = bindingContext;
				window.selectedRowData = selectedRowData;
			} else {
				var bindingContext = window.bindingContext;
				var selectedRowData = window.selectedRowData;
			}

			//check for IE
			if (typeof Object.assign != 'function') {
				Object.assign = function (target) {
					'use strict';
					if (target == null) {
						throw new TypeError('Cannot convert undefined or null to object');
					}

					target = Object(target);
					for (var index = 1; index < arguments.length; index++) {
						var source = arguments[index];
						if (source != null) {
							for (var key in source) {
								if (Object.prototype.hasOwnProperty.call(source, key)) {
									target[key] = source[key];
								}
							}
						}
					}
					return target;
				};
			}

			var clonedSelectedRowData = Object.assign({}, selectedRowData);
			var ShipmentDialogModel = this.getView().getModel("shipmentDialogModel");
			ShipmentDialogModel.setSizeLimit(1000);
			ShipmentDialogModel.setProperty("/selectedShipment", clonedSelectedRowData);
			if (clonedSelectedRowData.FRGHT_TERM_COD.length === 0) {
				this.getView().byId("shippingTermLabel").addStyleClass("label--required");
				this.getView().byId("shippingTerm").setEnabled(true);
			} else {
				this.getView().byId("shippingTermLabel").removeStyleClass("label--required");
				this.getView().byId("shippingTerm").setEnabled(false);
			}

			if (ShipmentDialogModel.getProperty("/selectedShipment/CARRIER") === "OT") {
				ShipmentDialogModel.setProperty("/isOtherCarrierFieldVisible", true);
			} else {
				ShipmentDialogModel.setProperty("/isOtherCarrierFieldVisible", false);
			}

			if (clonedSelectedRowData.FRGHT_TERM_COD === "C") {
				this.getView().byId("account_box").setVisible(true);
				this.getView().byId("accountLabel").addStyleClass("label--required");
			} else {
				this.getView().byId("accountLabel").removeStyleClass("label--required");
				if (this.getView().byId("carrier") && this.getView().byId("carrier").getSelectedKey() !== "OT") {
					this.getView().byId("account_box").setVisible(false);
				} else {
					this.getView().byId("account_box").setVisible(true);
				}
			}

			//fetch labels
			this.fetchLabels(bindingContext, ShipmentDialogModel);
		},

		onPressReadyToShipDialog: function (oEvent) {

			var oDataModel = this.getModel();
			var oView = this.getView();
			var that = this;
			if (oEvent) {
				var sPath = oEvent.getSource().getBindingContext().getPath();
				window.sPath = sPath;
			} else {
				var sPath = window.sPath;
			}
			if (sPath) {
				this._oReadyToShipmentDetailDialog().bindElement({
					path: sPath
				});
			}
			//Shipment Dialog Model
			var oRModel = new sap.ui.model.json.JSONModel();
			// var oCurrentData = oDataModel.getProperty(sPath);
			//Check if IE, if so increase width
			if (window.document.documentMode) {
				this.byId("noOfCartonsLabelR").setWidth("30rem");
				this.byId("cartonBoxR").setWidth("13%");
				this.byId("provinceBoxR").setWidth("20%");
				this.byId("cityBoxR").setWidth("20%");
			}
			if (sap.ui.getCore().getConfiguration().getLanguage() === 'fr') {
				this.byId("noOfCartonsR").setWidth("3.5rem");
				this.byId("carrierR").setWidth("100%");
			}

			if (typeof Object.assign != 'function') {
				Object.assign = function (target) {
					'use strict';
					if (target == null) {
						throw new TypeError('Cannot convert undefined or null to object');
					}

					target = Object(target);
					for (var index = 1; index < arguments.length; index++) {
						var source = arguments[index];
						if (source != null) {
							for (var key in source) {
								if (Object.prototype.hasOwnProperty.call(source, key)) {
									target[key] = source[key];
								}
							}
						}
					}
					return target;
				};
			}
			if (oEvent) {
				var bindingContext = oEvent.getSource().getBindingContextPath();
				var selectedRowData = oEvent.getSource().getModel().getData(bindingContext);
				window.bindingContext = bindingContext;
				window.selectedRowData = selectedRowData;
			} else {
				var bindingContext = window.bindingContext;
				var selectedRowData = window.selectedRowData;
			}
			var clonedSelectedRowData = Object.assign({}, selectedRowData);
			//Must set date object before passing
			var cDate = clonedSelectedRowData.SCHEDULE_DATE.slice(4, 6) + "/" + clonedSelectedRowData.SCHEDULE_DATE.slice(6, 8) + "/" +
				clonedSelectedRowData.SCHEDULE_DATE.slice(0, 4);
			clonedSelectedRowData.SCHEDULE_DATE = new Date(cDate);
			oRModel.setProperty("/selectedShipment", clonedSelectedRowData);
			this.fetchCarrierList("SHIP_ID", oRModel, this._oReadyToShipmentDetailDialog(), selectedRowData.SHIP_ID, '');
			//Can we reset tracking # and carrier name? f
			oRModel.setProperty("/otherCarrier", clonedSelectedRowData.CARRIER_OTHERS);
			//Rather than fetch tracking numbers, we can just set them in a loop... a bit sloppy, but no performance impact
			that.byId("trackingIdR").destroyTokens();
			oDataModel.getData(bindingContext).READY_TO_SHIP_TRACK_NUMSet.__list.forEach(function (value, index, array) {
				that.byId("trackingIdR").addToken(new sap.m.Token({
					text: value.slice(value.indexOf("TRACK_NUM='") + 11, -2)
				}));
			});
			//Destroy dialogue model if using R model. This lets all functions know which screen is being used
			if (oView.getModel("shipmentDialogModel")) {
				oView.setModel(oView.getModel("shipmentDialogModel"), "shipmentDialogModelBackup");
				oView.setModel(null, "shipmentDialogModel");
			}
			oView.setModel(oRModel, "shipmentDialogModelR");
			oView.setModel(sPath, "path");
			oView.setModel(selectedRowData.TOTAL_WEIGHT, "Weight");
			oView.byId("trackingIdR").addValidator(function (args) {
				var text = args.text;
				return new Token({
					key: text,
					text: text
				});
			});

			//Must also set logic for carrier field	
			if (clonedSelectedRowData.FRGHT_TERM_COD.length === 0) {
				this.getView().byId("shippingTermLabelR").addStyleClass("label--required");
				this.getView().byId("shippingTermR").setEnabled(true);
			} else {
				this.getView().byId("shippingTermLabelR").removeStyleClass("label--required");
				this.getView().byId("shippingTermR").setEnabled(false);
			}
			if (oRModel.getProperty("/selectedShipment/CARRIER") === "OT") {
				oRModel.setProperty("/isOtherCarrierFieldVisible", true);
			} else {
				oRModel.setProperty("/isOtherCarrierFieldVisible", false);
			}
			if (clonedSelectedRowData.FRGHT_TERM_COD === "C") {
				this.getView().byId("account_boxR").setVisible(true);
				this.getView().byId("accountLabelR").addStyleClass("label--required");
			} else {
				this.getView().byId("accountLabelR").removeStyleClass("label--required");
				if (this.getView().byId("carrierR") && this.getView().byId("carrierR").getSelectedKey() !== "OT") {
					this.getView().byId("account_boxR").setVisible(false);
				} else {
					this.getView().byId("account_boxR").setVisible(true);
				}
			}

			oView.byId("scheduleDateR").addDelegate({
				onAfterRendering: function () {
					oView.byId("scheduleDateR").$().find('INPUT').attr('disabled', true);
				}
			}, oView.byId("scheduleDateR"));
			this._oReadyToShipmentDetailDialog().open();
			// this._oReadyToShipmentDetailDialog().openBy(oEvent.getSource());

		},
		_oReadyToShipmentDetailDialog: function () {
			var oView = this.getView();

			if (!this.ReadyToShipmentDetailDialog) {
				this.ReadyToShipmentDetailDialog = sap.ui.xmlfragment(oView.getId(), "YRTV_ONE_TILE.YRTV_ONE_TILE.view.Worklist.SaveConfirmShipment", this);
				this.getView().addDependent(this.ReadyToShipmentDetailDialog);
				this.formatMobileDetails(sap.ui.Device.system.phone, "R");

				this.byId("idLabelTableR").addDelegate({
					onAfterRendering: function () {
						//Hiding DOM elements on load!
						var doms = document.getElementsByClassName("sapMListTblSubCntRow");
						var domsArr = Array.prototype.slice.call(doms);
						domsArr.forEach(function (item) {
							if (item.children && item.children.length == 3 && item.children[0].innerText == "_" && item.children[2].innerText == "_") {
								//We've found a marked column. Hide it and previous 4. 
								//Previous 4 can be unhidden, but this one will NEVER be unhidden
								item.style.display = "None";
								item.previousElementSibling.style.display = "None";
								item.previousElementSibling.previousElementSibling.style.display = "None";
								item.previousElementSibling.previousElementSibling.previousElementSibling.style.display = "None";
								item.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.style.display = "None";
							}
						});

					}
				}, oView.byId("scheduleDateR"));
				this.ReadyToShipmentDetailDialog.setContentHeight("100%");

				//add color delegate
				var readyScanLabelNumber = this.byId("ReadyLabelNumber");
				var labelNumberDelegate = {
					onAfterRendering: function () {
						var labelNum = this.mProperties.text;

						this.removeStyleClass("redLabelWorklist");
						this.removeStyleClass("yellowLabelWorklist");
						this.removeStyleClass("greenLabelWorklist");
						this.removeStyleClass("whiteLabelWorklist");

						if (labelNum.indexOf('98181') === 0) {
							this.addStyleClass('redLabelWorklist');
						} else if (labelNum.indexOf('98182') === 0) {
							this.addStyleClass('yellowLabelWorklist');
						} else if (labelNum.indexOf('98183') === 0) {
							this.addStyleClass('greenLabelWorklist');
						} else if (labelNum.indexOf('98184') === 0) {
							this.addStyleClass('whiteLabelWorklist');
						}
					}
				};
				readyScanLabelNumber.addDelegate(labelNumberDelegate, false, readyScanLabelNumber, true);
				/*
				var funct = this.ExpandCollapse;
				this.byId("matTxtR").attachBrowserEvent("click", funct);
				this.byId("makTxtR").attachBrowserEvent("click", funct);
				this.byId("mengeTxtR").attachBrowserEvent("click", funct);
				this.byId("costTxtR").attachBrowserEvent("click", funct);
				this.byId("rgaTxtR").attachBrowserEvent("click", funct);
				this.byId("addrTxtR").attachBrowserEvent("click", funct);
				this.byId("pstlTxtR").attachBrowserEvent("click", funct);

				this.byId("articleColumnTxtR").attachBrowserEvent("click", funct);
				this.byId("makColumnTxtR").attachBrowserEvent("click", funct);
				this.byId("mengeColumnTxtR").attachBrowserEvent("click", funct);
				this.byId("costColumnTxtR").attachBrowserEvent("click", funct);
				this.byId("rgaColumnTxtR").attachBrowserEvent("click", funct);
				this.byId("addrColumnTxtR").attachBrowserEvent("click", funct);
				this.byId("pstlColumnTxtR").attachBrowserEvent("click", funct);
				*/
			}
			//Ensure all icons are reset slorge
			this.byId("idLabelTableR").getItems().forEach(function (item) {                        
				item.getAggregation("cells")[9].setSrc("sap-icon://navigation-down-arrow");
			});
			this.setCollapseHash();
			return this.ReadyToShipmentDetailDialog;

		},
		onSaveNConfirmShipmentCancel: function () {
			this._oReadyToShipmentDetailDialog().close();
		},

		oCreateReadyToShipmentDetailDialog: function () {
			var oView = this.getView();
			this._oReadyToShipmentDetailDialog = sap.ui.xmlfragment(oView.getId(), "YRTV_ONE_TILE.YRTV_ONE_TILE.view.Worklist.SaveConfirmShipment", this);
			this.getView().addDependent(this._oReadyToShipmentDetailDialog);

			//Shipment Dialog Model
			var oModel = new sap.ui.model.json.JSONModel();

			this.getView().setModel(oModel, "shipmentDialogModel");

			//Do mobile formatting
			this.formatMobileDetails(sap.ui.Device.system.phone, "R");

			this.byId("idLabelTableR").addDelegate({
				onAfterRendering: function () {
					console.log("George Test");
					//Hiding DOM elements on load!
					//document.getElementsByClassName("sapMListTblSubCntRow");
				}
			}, oView.byId("scheduleDateR"));

			// this.getView().byId("trackingIdR").addValidator(function (args) {
			// 	var text = args.text;
			// 	return new Token({
			// 		key: text,
			// 		text: text
			// 	});
			// });
		},
		onScheduleDateDetailChange: function (oEvent) {
			/*
			var newShipDate = oEvent.getParameters().value;
			var pickupDateFld = oEvent.getSource();
			var bindObj = pickupDateFld.getBindingContext().getObject();
			var oldShipDate = bindObj.SCHEDULE_DATE;
			var cDate = oldShipDate.slice(4, 6) + "/" + oldShipDate.slice(6, 8) + "/" + oldShipDate.slice(0, 4);
			var oDate = newShipDate.slice(6, 10) + newShipDate.slice(0, 2) + newShipDate.slice(3, 5);
			var oldShipDateFormat = new Date(cDate);
			var onewShipDateFormat = new Date(newShipDate);
			var oDataModel = this.getModel(),
				sPath = oEvent.getSource().getBindingContext().getPath();
			if (oldShipDateFormat !== onewShipDateFormat) {

				var newShdDate = newShipDate.slice(6, 10) + newShipDate.slice(0, 2) + newShipDate.slice(3, 5);
				bindObj.SCHEDULE_DATE = newShdDate;
				oDataModel.setProperty(sPath + "/SCHEDULE_DATE", oDate);
				oDataModel.setProperty(sPath + "/BTN_TYP", "D");
				oDataModel.setProperty(sPath + "/ICON", false);

			}
			*/
		},

		onScheduleDateChange: function (oEvent) {

			var oldPath = this.getView().getModel("DatePath");

			var oView = this.getView();
			var newShipDate = oEvent.getParameters().value;
			var pickupDateFld = oEvent.getSource();
			var bindObj = pickupDateFld.getBindingContext().getObject();
			var oldShipDate = bindObj.SCHEDULE_DATE;
			var cDate = oldShipDate.slice(4, 6) + "/" + oldShipDate.slice(6, 8) + "/" + oldShipDate.slice(0, 4);
			var oDate = newShipDate.slice(6, 10) + newShipDate.slice(0, 2) + newShipDate.slice(3, 5);
			var oldShipDateFormat = new Date(cDate);
			var onewShipDateFormat = new Date(newShipDate);
			var oDataModel = this.getModel(),
				sPath = oEvent.getSource().getBindingContext().getPath();

			if (oldPath && oldPath !== sPath) {
				/*
				oEvent.getSource().setValue(cDate);
				//Set Date back
				
				sap.m.MessageBox.show(	
					"You have unsaved changes, please save before proceeding or changes will be lost.", {	
						icon: sap.m.MessageBox.Icon.ERROR,	
						title: "Error",	
						actions: [sap.m.MessageBox.Action.OK]	
					});	
					return;
					*/
			}

			if (oldShipDateFormat !== onewShipDateFormat) {

				var newShdDate = newShipDate.slice(6, 10) + newShipDate.slice(0, 2) + newShipDate.slice(3, 5);
				//bindObj.SCHEDULE_DATE = newShdDate;
				oDataModel.setProperty(sPath + "/SCHEDULE_DATE", oDate);
				oDataModel.setProperty(sPath + "/BTN_TYP", "D");
				oDataModel.setProperty(sPath + "/ICON", false);
				//Important; do NOT transfer the _NEW value to schedule yet. Instead, hold them temporarily until save or exit
				this.getView().setModel(oDate, sPath + "/Date");
				//this.getView().setModel(oDate, "DateVal");
			}
		},
		onPrintBOL: function (oEvent) {
			var bindObj = oEvent.getSource().getBindingContext().getObject();
			var shipId = bindObj.SHIP_ID;
			this._openPDF(shipId, this);
		},
		onSubmitPrintPress: function () {

			var me = this;
			var bundle = this.getResourceBundle();
			var printerHost = this.byId("idPrinterList").getSelectedKey();
			//To print a Pallet Label
			var oModel = this.getOwnerComponent().getModel();
			var shipid = this.getModel("shipid");
			var servicePath = "/PRINT_BOLSet";

			if ((printerHost === "") || (printerHost === undefined)) {
				//Validation error message
				sap.m.MessageBox.show(
					me.getResourceBundle().getText("pleaseSelectPrinter"), {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: me.getResourceBundle().getText("Error"),
						actions: [sap.m.MessageBox.Action.OK]
					});
				return;
			}

			var postData = {
				"WERKS": this.siteId,
				"SHIP_ID": shipid,
				"PRINTER": printerHost
			};

			oModel.create(servicePath, postData, {
				success: function (oData, oResponse) {
					//Go back to Main route
					//Start Change NXM8OKB ISE-175
					var oUserDetails = this.getOwnerComponent().getModel("UserInfoModel");
					var oUser = oUserDetails.getData();
					//End Change NXM8OKB ISE-175
					//End NXM1YSC JIRA ISE ISE-357
				},
				error: function (error) {
					MessageToast.show((me.getResourceBundle().getText("BOLPrintFail")), {
						duration: 4000,
						closeOnBrowserNavigation: false
					});
					//me._oErrorHandler._showServiceError(JSON.parse(error.responseText).error.message.value);

				}
			});
			MessageToast.show((me.getResourceBundle().getText("BOLPrintSubmit")), {
				duration: 4000,
				closeOnBrowserNavigation: false
			});
			this._oPrintDialog.close();
		},

		onCancelPrintPress: function () {
			this._oPrintDialog.close();
		},

		_openPDF: function (shipId, that) {
			var oModel = this.getOwnerComponent().getModel();
			var OHMModel = this.getOwnerComponent().getModel("OHMModel");
			var PrinterListInfoModel = new sap.ui.model.json.JSONModel();
			this.getOwnerComponent().setModel(PrinterListInfoModel, "PrinterListInfoModel");
			var serviceUrl = oModel.sServiceUrl;
			var me = this;
			var printerHost;

			//If on mobile, must service site-wide printer list on new fragment. DON'T show PDF
			if (sap.ui.Device.system.phone) {
				if (!this._oPrintDialog) {
					//Start NXM1YSC JIRA ISE-422
					this._oPrintDialog = sap.ui.xmlfragment(this.getView().getId(), "YRTV_ONE_TILE.YRTV_ONE_TILE.view.Worklist.PrinterList", this);
					//End NXM1YSC JIRA ISE-422
					this.getView().addDependent(this._oPrintDialog);
					// me._oPrintDialog.setBusy(true);
				}
				//Now retrieve the list from oData
				OHMModel.read("/PRINTERSET", {
					success: function (oData, oResponse) {
						var statusCode = oResponse.statusCode;
						if (statusCode === '200') {
							if (oData.results.length > 0) {
								PrinterListInfoModel.setData(oData);
							}
						}
						me.getOwnerComponent().setModel(PrinterListInfoModel, "PrinterListInfoModel");
						me.byId("printText").setText(me.getView().getModel("WorkListi18n").getResourceBundle().getText("PrinterDialogTitle", shipId));
						me.setModel(shipId, "shipid");
						me._oPrintDialog.open();
					},
					error: function (error) {
						console.log(error);
					}

				});

			} else {
				var sPath = serviceUrl + "/WLBOL_PDFSet(SHIP_ID='" + shipId + "',WERKS='" + that.siteId + "')/$value";
				var oUrl;
				if (sap.ui.Device.system.phone) {
					oUrl = "/sap/bc/ui5_ui5/sap/yrtv_pdfjs/js/web/viewer.html?file=" + encodeURIComponent(sPath);
				} else {
					oUrl = sPath;
				}
				sap.m.URLHelper.redirect(oUrl, true);
			}
		},
		onAction: function (oEvent) {
			var oView = this.getView();
			var oDataModel = this.getModel(),
				sPath = oEvent.getSource().getBindingContext().getPath(),
				oCurrentData = oDataModel.getProperty(sPath),
				that = this;

			var oBtnType = oCurrentData.BTN_TYP;
			if (oBtnType === "D") {
				/*
				if (sPath !== oView.getModel("DatePath")){
					//Cannot save, as somehow a different date is being saved. This should never happen
				sap.m.MessageBox.show(	
					"You have unsaved changes, please save before proceeding or changes will be lost.", {	
						icon: sap.m.MessageBox.Icon.ERROR,	
						title: "Error",	
						actions: [sap.m.MessageBox.Action.OK]	
					});	
					return;
				}*/
				this.onSave(sPath);
			} else if (oBtnType === "E") {

				var oMsg1 = this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipConfirmMsg1"),
					oMsg2 = this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipConfirmMsg2"),
					oTitle = this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipConfirm"),
					oBtnNo = this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipConfirmNo"),
					oBtnYes = this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipConfirmYes"),
					bindObj = oEvent.getSource().getBindingContext().getObject();

				var oHBox1 = new HBox({
					items: [
						new Text({
							text: oMsg1
						})
					]
				});

				var oHBox2 = new HBox({
					items: [
						new Text({
							text: oMsg2
						})
					]
				});
				var oVBox = new VBox({
					items: [oHBox1, oHBox2]
				});
				var dialog = new Dialog({
					title: oTitle,
					type: "Message",
					content: [oVBox],
					beginButton: new Button({
						text: oBtnNo,
						press: function () {
							dialog.close();
						}
					}),
					endButton: new Button({
						text: oBtnYes,
						type: sap.m.ButtonType.Emphasized,
						press: function () {
							that.onConfirm(sPath, bindObj);
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});
				/* This is code for adding 'X' button
				  dialog.onAfterRendering = function() {
				    if (sap.m.Dialog.prototype.onAfterRendering) {
				      sap.m.Dialog.prototype.onAfterRendering.apply(this, arguments);
				      var b = $('<div class="closebtn">X</div>');
				      this.$().prepend(b);
				      b.click(function() {
				        this.close(); 
				      }.bind(this));
				    }
				  }
				*/
				dialog.open();
			}

		},
		onSave: function (sPath) {
			var oView = this.getView();
			var oDataModel = this.getModel();
			oDataModel.setProperty(sPath + "/SCHEDULE_DATE", oView.getModel(sPath + "/Date"));
			var oCurrentData = oDataModel.getProperty(sPath);
			oCurrentData.ACTION = 'C';
			//Must remove all extended values, to avoid XML error (this is simple update)
			//oCurrentData.READY_TO_SHIP_TRACK_NUMSet = undefined;	
			//oCurrentData.READY_TO_SHIP_DETAILSet = undefined;	

			var Payload = {
				ACTION: oCurrentData.ACTION,
				ADDRESS: oCurrentData.ADDRESS,
				ADDR_NO: oCurrentData.ADDR_NO,
				BTN_TYP: oCurrentData.BTN_TYP,
				CARRIER: oCurrentData.CARRIER,
				CARRIER_ACCOUNT: oCurrentData.CARRIER_ACCOUNT,
				CARRIER_NAME: oCurrentData.CARRIER_NAME,
				CARRIER_OTHERS: oCurrentData.CARRIER_OTHERS,
				CITY1: oCurrentData.CITY1,
				COUNTRY: oCurrentData.COUNTRY,
				FRGHT_TERM_COD: oCurrentData.FRGHT_TERM_COD,
				ICON: oCurrentData.ICON,
				NO_OF_CARTONS: oCurrentData.NO_OF_CARTONS,
				POSTAL_CODE: oCurrentData.POSTAL_CODE,
				REGION: oCurrentData.REGION,
				RGA_NUM: oCurrentData.RGA_NUM,
				SCHEDULE_DATE: oCurrentData.SCHEDULE_DATE,
				SHIP_ID: oCurrentData.SHIP_ID,
				TOTAL_WEIGHT: oCurrentData.TOTAL_WEIGHT,
				TRACKING_NUM: oCurrentData.TRACKING_NUM,
				VENDOR: oCurrentData.VENDOR,
				VENDOR_NAME: oCurrentData.VENDOR_NAME,
				WERKS: oCurrentData.WERKS
			};

			sap.ui.core.BusyIndicator.show();
			oDataModel.update(sPath, Payload, {
				refreshAfterChange: false,
				success: function (oData) {
					//oView.setModel(null, "DatePath");
					//oView.setModel(null, "DateVal");
					oDataModel.setProperty(sPath + "/BTN_TYP", "E");
					sap.ui.core.BusyIndicator.hide();
				}.bind(oDataModel),
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
				}
			});

		},
		onConfirm: function (sPath, bindObj) {
			var labelModel = this.getOwnerComponent().getModel();
			var updatePayload = {
				"SHIP_ID": bindObj.SHIP_ID,
				"WERKS": bindObj.WERKS,
				"ACTION": "C",
				"PICKUP_DATE": bindObj.SCHEDULE_DATE
			};

			var that = this;
			sap.ui.core.BusyIndicator.show();
			labelModel.create("/WLShipHeaderSet", updatePayload, {
				success: function (odata, response) {
					that.onRefreshPress();

					sap.ui.core.BusyIndicator.hide();

				},
				error: function (response) {
					sap.ui.core.BusyIndicator.hide();
					sap.m.MessageBox.error(
						JSON.parse(response.responseText).error.message.value, {
							actions: [MessageBox.Action.OK]
						}
					);
				}
			});

		},

		createShipmentDialog: function () {
			var oView = this.getView();
			var that = this;
			//Our views make use of IDs. Unfortunately, going back into the app from an external application
			//causes duplicate IDs EVEN after destroying the fragment. Thus, each time the fragment is created we must
			//increment a counter and add it. 
			this._oShipmentDialog = sap.ui.xmlfragment(oView.getId(), "YRTV_ONE_TILE.YRTV_ONE_TILE.view.Worklist.CreatenModifyShipment", this);
			this._oShipmentDialog.addStyleClass("sapUiMobileFragmentHeight");
			this._oShipmentDialog.setContentHeight("100%")

			this.getView().addDependent(this._oShipmentDialog);

			//Check if IE or FR, if so increase width
			if (window.document.documentMode) {
				this.byId("noOfCartonsLabel").setWidth("30rem");
				this.byId("cartonBox").setWidth("13%");
				this.byId("provinceBox").setWidth("20%");
				this.byId("cityBox").setWidth("20%");
			}
			if (sap.ui.getCore().getConfiguration().getLanguage() === 'fr') {
				this.byId("noOfCartons").setWidth("3.5rem");
				this.byId("carrier").setWidth("100%");
			}

			//Do mobile formatting
			this.formatMobileDetails(sap.ui.Device.system.phone, "");

			//Shipment Dialog Model
			var oModel = new sap.ui.model.json.JSONModel();

			this.getView().setModel(oModel, "shipmentDialogModel");
			if (sap.ui.Device.system.phone) {
				this.byId("idLabelTable").addDelegate({
					onAfterRendering: function () {
						//Hiding DOM elements on load!
						var doms = document.getElementsByClassName("sapMListTblSubCntRow");
						var domsArr = Array.prototype.slice.call(doms);
						domsArr.forEach(function (item) {
							if (item.children && item.children.length == 3 && item.children[0].innerText == "_" && item.children[2].innerText == "_") {
								//We've found a marked column. Hide it and previous 4. 
								//Previous 4 can be unhidden, but this one will NEVER be unhidden
								item.style.display = "None";
								item.previousElementSibling.style.display = "None";
								item.previousElementSibling.previousElementSibling.style.display = "None";
								item.previousElementSibling.previousElementSibling.previousElementSibling.style.display = "None";
								item.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.style.display = "None";
							}
						});

					}
				}, oView.byId("scheduleDate"));
				/*
				var funct = this.ExpandCollapse;
				this.byId("matTxt").attachBrowserEvent("click", funct);
				this.byId("makTxt").attachBrowserEvent("click", funct);
				this.byId("mengeTxt").attachBrowserEvent("click", funct);
				this.byId("costTxt").attachBrowserEvent("click", funct);
				this.byId("rgaTxt").attachBrowserEvent("click", funct);
				this.byId("addrTxt").attachBrowserEvent("click", funct);
				this.byId("pstlTxt").attachBrowserEvent("click", funct);

				this.byId("articleColumnTxt").attachBrowserEvent("click", funct);
				this.byId("makColumnTxt").attachBrowserEvent("click", funct);
				this.byId("mengeColumnTxt").attachBrowserEvent("click", funct);
				this.byId("costColumnTxt").attachBrowserEvent("click", funct);
				this.byId("rgaColumnTxt").attachBrowserEvent("click", funct);
				this.byId("addrColumnTxt").attachBrowserEvent("click", funct);
				this.byId("pstlColumnTxt").attachBrowserEvent("click", funct);
				*/
			}

			var BuildScanLabelNumber = this.byId("CreateShipmentLabelNumber");
			var labelNumberDelegate = {
				onAfterRendering: function () {
					var labelNum = this.mProperties.text;

					this.removeStyleClass("redLabelWorklist");
					this.removeStyleClass("yellowLabelWorklist");
					this.removeStyleClass("greenLabelWorklist");
					this.removeStyleClass("whiteLabelWorklist");

					if (labelNum.indexOf('98181') === 0) {
						this.addStyleClass('redLabelWorklist');
					} else if (labelNum.indexOf('98182') === 0) {
						this.addStyleClass('yellowLabelWorklist');
					} else if (labelNum.indexOf('98183') === 0) {
						this.addStyleClass('greenLabelWorklist');
					} else if (labelNum.indexOf('98184') === 0) {
						this.addStyleClass('whiteLabelWorklist');
					}
				}
			};
			BuildScanLabelNumber.addDelegate(labelNumberDelegate, false, BuildScanLabelNumber, true);

			this.getView().byId("trackingId").addValidator(function (args) {
				var text = args.text;
				return new Token({
					key: text,
					text: text
				});
			});
			oView.byId("scheduleDate").addDelegate({
				onAfterRendering: function () {
					oView.byId("scheduleDate").$().find('INPUT').attr('disabled', true);
				}
			}, oView.byId("scheduleDate"));
		},

		resetValues: function () {
			var ShipmentDialogModel = this.getView().getModel("shipmentDialogModel");
			ShipmentDialogModel.setProperty("/minDate", new Date());
			ShipmentDialogModel.setProperty("/scheduledDate", null);
			ShipmentDialogModel.setProperty("/numberOfCartons", null);
			ShipmentDialogModel.setProperty("/selectedShipment", null);
			ShipmentDialogModel.setProperty("/labels", null);
			ShipmentDialogModel.setProperty("/carrierList", null);
			ShipmentDialogModel.setProperty("/otherCarrier", null);
			ShipmentDialogModel.setProperty("/totalWeight", null);
			ShipmentDialogModel.setProperty("/isOtherCarrierFieldVisible", false);
			this.getView().byId("trackingId").removeAllTokens();
		},

		fetchLabels: function (path, Model) {
			var labelModel = this.getOwnerComponent().getModel();
			var that = this;
			this._oShipmentDialog.setBusy(true);
			labelModel.read(path, {
				urlParameters: {
					"$expand": "SCHEDULE_SHIPMENT_DETAILSet"
				},
				success: function (data) {
					Model.setProperty("/labels", data);
					//Auto select all the rows
					that.getView().byId("idLabelTable").selectAll();
					that.calculateWeightAndLabelsSelected();
					//Fetch Carier list based on label number
					that.sLabelSelected = data.SCHEDULE_SHIPMENT_DETAILSet.results[0].LABEL_NUM;
					that.fetchCarrierList("LABEL_NUM", Model, that._oShipmentDialog, that.sLabelSelected, '');
					that._oShipmentDialog.setBusy(false);
				},
				error: function (oError) {
					that.dialogue.setBusy(false);
					that.onError(oError);
				}
			});
		},

		fetchCarrierList: function (filter, Model, Dialogue, value, value2) {
			var labelModel = this.getOwnerComponent().getModel();
			//var ShipmentDialogModel = this.getView().getModel("shipmentDialogModel");
			var filterVal = [];
			filterVal.push(new sap.ui.model.Filter(filter, "EQ", value));
			if (value2 !== "") {
				filterVal.push(new sap.ui.model.Filter('FRGHT_TERM_COD', "EQ", value2));
			}
			var that = this;

			Dialogue.setBusy(true);
			labelModel.read("/WLCarrierSet", {
				filters: filterVal,
				success: function (data) {
					Dialogue.setBusy(false);
					Model.setProperty("/carrierList", data.results);
					that.setCollapseHash();
				},
				error: function (oError) {
					Dialogue.setBusy(false);
					that.onError(oError);
				}
			});
		},

		onError: function (error) {
			sap.m.MessageBox.show(
				JSON.parse(error.responseText).error.message.value, {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Error",
					actions: [sap.m.MessageBox.Action.OK]
				});
		},
		onWeightChange: function (oEvent) {
			var oldWeight = this.getView().getModel("Weight");
			var newValue = oEvent.getParameter("newValue");

			var regex = /^[0-9]?[0-9]?[0-9]?[0-9]?(\.[0-9]?[0-9]?[0-9]?)?/;
			if (newValue.match(regex)[0] !== newValue) {
				if (this.getView().byId("totalWeight")) {
					this.getView().byId("totalWeight").setValue(oldWeight);
				} else {
					this.getView().byId("totalWeightR").setValue(oldWeight);
				}
				return;
			}
			this.getView().setModel(newValue, "Weight");
		},

		calculateWeightAndLabelsSelected: function () {
			var ShipmentDialogModel = this.getView().getModel("shipmentDialogModel");
			var selectedItems = this.getView().byId("idLabelTable").getSelectedItems();
			var totalWeight = 0;

			selectedItems.forEach(function (item) {
				totalWeight = totalWeight + (+ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/WEIGHT"));
			});

			ShipmentDialogModel.setProperty("/totalWeight", totalWeight);
			this.byId("totalWeight").setValue(totalWeight);
			this.getView().setModel(totalWeight, "Weight");

			//Also set the text count
			if (this.byId("idLabelTable").getSelectedItems().length != 1) {
				this.byId("LabelCountText").setText(this.getResourceBundle().getText("labelsSelected", [this.byId("idLabelTable").getSelectedItems()
					.length
				]));
			} else {
				this.byId("LabelCountText").setText(this.getResourceBundle().getText("labelSelected"));
			}
		},

		onCarrierSelection: function () {
			var postFix = "";
			var ShipmentDialogModel = this.getView().getModel("shipmentDialogModel");
			if (!ShipmentDialogModel) {
				postFix = "R";
				ShipmentDialogModel = this.getView().getModel("shipmentDialogModelR");
			}
			if (ShipmentDialogModel.getProperty("/selectedShipment/CARRIER") === "OT") {
				ShipmentDialogModel.setProperty("/isOtherCarrierFieldVisible", true);
			} else {
				ShipmentDialogModel.setProperty("/isOtherCarrierFieldVisible", false);
			}
			if (this.byId("shippingTerm" + postFix).getSelectedItem() && this.byId("shippingTerm" + postFix).getSelectedItem().getKey() === "C") {
				this.getView().byId("accountLabel" + postFix).addStyleClass("label--required");
				this.getView().byId("account_box" + postFix).setVisible(true);
			} else {
				this.getView().byId("accountLabel" + postFix).removeStyleClass("label--required");
				if (this.getView().byId("carrier" + postFix) && this.getView().byId("carrier" + postFix).getSelectedKey() !== "OT") {
					this.getView().byId("account_box" + postFix).setVisible(false);
				} else {
					this.getView().byId("account_box" + postFix).setVisible(true);
				}
			}

		},

		validateBeforeCreate: function (mode) {
			//Both views (create vs save) are identical, except for IDs, which have "R" appended to them
			//To make this work, we must append R if the mode is "S" (Save). If the mode is "C" (Create) then we don't do anything for now
			var postFix = "";
			if (mode === "S") {
				postFix = "R";
			}
			var ShipmentDialogModel = this.getView().getModel("shipmentDialogModel" + postFix);
			var selectedItems = this.getView().byId("idLabelTable" + postFix).getSelectedItems();

			if (!this.byId("shippingTerm" + postFix).getSelectedItem()) {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_SelectShippingTerm");
			}

			//First check if at least 1 item selected; can skip if shipment already created
			if (selectedItems.length === 0 && mode !== "S") {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_AtLeastOneLabel");
			}
			if (!this.byId("carrier" + postFix).getSelectedItem()) {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_SelectCarrier");
			}
			if (!this.byId("scheduleDate" + postFix).getValue()) {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_SelectScheduleDate");
			}
			if (!this.byId("address" + postFix).getValue()) {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_FillAddress");
			}
			if (!this.byId("city" + postFix).getValue()) {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_FillCity");
			}
			if (!this.byId("province" + postFix).getValue()) {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_FillProvince");
			}
			if (!this.byId("postalCode" + postFix).getValue() || this.byId("postalCode" + postFix).getValue().length <= 4) {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_FillPostal");
			}
			if (!this.byId("noOfCartons" + postFix).getValue()) {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_FillCartons");
			}
			if (this.byId("trackingId" + postFix).getTokens().length === 0) {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_AtLeastOneTrackingID");
			} else if (this.byId("trackingId" + postFix).getTokens().length > parseInt(this.byId("noOfCartons" + postFix).getValue(), 10)) {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_MoreTrackingThanCartons");
			}
			if (!this.byId("totalWeight" + postFix) || parseFloat(this.byId("totalWeight" + postFix).getValue()) === 0 || isNaN(parseFloat(this
					.byId("totalWeight" + postFix).getValue()))) {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_FillWeight");
			}
			if (ShipmentDialogModel.getData().selectedShipment.FRGHT_TERM_COD === "C" && this.byId("account" + postFix).getValue() === '') {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_FillAccount");
			}
			if (ShipmentDialogModel.getProperty("/selectedShipment/CARRIER") === "OT" && this.byId("specify" + postFix).getValue() === '') {
				return this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_FillOtherCarrier");
			}
			return "";
		},

		onPressSaveShipment: function () {
			var oView = this.getView();
			var error = this.validateBeforeCreate("S");
			if (error !== "") {
				sap.m.MessageBox.show(
					error, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Error",
						actions: [sap.m.MessageBox.Action.OK]
					});
				return;
			}

			var ShipmentDialogModel = oView.getModel("shipmentDialogModelR");
			//var selectedItems = this.getView().byId("idLabelTableR").getSelectedItems();

			var selectedItems = oView.getModel().getData(oView.getModel("path")).READY_TO_SHIP_DETAILSet;
			//Convert Date into backend YYYYMMDD format	
			var dateObject = new Date(this.byId("scheduleDateR").getValue());
			// SAPUI5 date formatter	
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYYMMdd"
			});
			// Format the date	
			var dateFormatted = dateFormat.format(dateObject);
			//Build a deep entity	
			var that = this;

			var payload = {
				"VENDOR": ShipmentDialogModel.getData().selectedShipment.VENDOR,
				"POSTAL_CODE": that.byId("postalCodeR").getValue(),
				"FRGHT_TERM_COD": that.byId("shippingTermR").getSelectedItem().getKey(),
				"CARRIER": that.byId("carrierR").getSelectedItem().getKey(),
				//"REASON_CODE": ShipmentDialogModel.getData().selectedShipment.REASON_CODE,	
				"WERKS": ShipmentDialogModel.getData().selectedShipment.WERKS,
				"CARRIER_NAME": that.byId("carrierR").getSelectedItem().getText(),
				"CARRIER_OTHERS": that.byId("specifyR").getValue(),
				"RGA_NUM": ShipmentDialogModel.getData().selectedShipment.RGA_NUM,
				"ADDR_NO": ShipmentDialogModel.getData().selectedShipment.ADDR_NO,
				"VENDOR_NAME": ShipmentDialogModel.getData().selectedShipment.VENDOR_NAME,
				//"LABEL_COUNT": selectedItems.length + "",	
				//"TOTAL_COST": "", //Must calculate in backend/not used?	
				"CARRIER_ACCOUNT": that.byId("accountR").getValue(),
				"SCHEDULE_DATE": dateFormatted,
				"ADDRESS": that.byId("addressR").getValue(),
				"CITY1": that.byId("cityR").getValue(),
				"REGION": that.byId("provinceR").getValue(),
				"COUNTRY": ShipmentDialogModel.getData().selectedShipment.COUNTRY,
				"NO_OF_CARTONS": that.byId("noOfCartonsR").getValue(),
				"TOTAL_WEIGHT": that.byId("totalWeightR").getValue(),
				"SHIP_ID": ShipmentDialogModel.getData().selectedShipment.SHIP_ID,
				"ACTION": "U",
				"READY_TO_SHIP_DETAILSet": oView.getModel().getData(oView.getModel("path")).READY_TO_SHIP_DETAILSet.__list.map(
					function (item) {
						return oView.getModel().getData("/" + item);
					}),
				"READY_TO_SHIP_TRACK_NUMSet": that.byId("trackingIdR").getTokens().map(function (item) {
					return {
						"SHIP_ID": ShipmentDialogModel.getData().selectedShipment.SHIP_ID,
						"TRACK_NUM": item.getText()
					};
				})
			};
			this.saveShipment(payload);

		},

		saveShipment: function (objectForShipment) {
			sap.ui.core.BusyIndicator.show();
			var oModel = this.getView().getModel();
			var that = this;
			var oView = this.getView();

			oModel.create("/READY_TO_SHIP_LISTSet",
				objectForShipment, {
					async: true,
					success: function (odata, response) {
						that.onRefreshPress();
						sap.ui.core.BusyIndicator.hide();
						MessageToast.show((that.getResourceBundle().getText("ShipmentDialog_SaveSuccess")), {
							duration: 4000,
							closeOnBrowserNavigation: false
						});

						oModel.setProperty(oView.getModel("path") + "/BTN_TYP", "E");
						//oModel.setProperty(	oView.getModel("path") + "/ICON", false);
						that._oReadyToShipmentDetailDialog().close();
					},
					error: function (oError, resp1, resp2) {
						sap.ui.core.BusyIndicator.hide();
						if (oError.responseText.indexOf('{"') !== -1) {
							var oErrorJSON = JSON.parse(oError.responseText);
							sap.m.MessageBox.show(
								oErrorJSON.error.message.value, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: that.getResourceBundle().getText("Error"),
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (oAction) {}
								});
						} else {
							sap.m.MessageBox.show(
								JSON.parse(oError.responseText).error.message.value, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: that.getResourceBundle().getText("Error"),
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (oAction) {}
								});
						}
						//that._oShipmentDialog.close();	
					}
				});
		},

		onPressCreateShipment: function () {
			//First, validate that mandatory inputs are populated, with at least one selected item
			var error = this.validateBeforeCreate("C");
			if (error !== "") {
				sap.m.MessageBox.show(
					error, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Error",
						actions: [sap.m.MessageBox.Action.OK]
					});
				return;
			}

			var ShipmentDialogModel = this.getView().getModel("shipmentDialogModel");
			var selectedItems = this.getView().byId("idLabelTable").getSelectedItems();

			//Convert Date into backend YYYYMMDD format
			var dateObject = new Date(this.byId("scheduleDate").getValue());
			// SAPUI5 date formatter
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYYMMdd"
			});
			// Format the date
			var dateFormatted = dateFormat.format(dateObject);

			//Build a deep entity
			var that = this;
			var payload = {
				"VENDOR": ShipmentDialogModel.getData().selectedShipment.VENDOR,
				"POSTAL_CODE": that.byId("postalCode").getValue(),
				"FRGHT_TERM_COD": that.byId("shippingTerm").getSelectedItem().getKey(),
				"CARRIER": that.byId("carrier").getSelectedItem().getKey(),
				"REASON_CODE": ShipmentDialogModel.getData().selectedShipment.REASON_CODE,
				"WERKS": ShipmentDialogModel.getData().selectedShipment.WERKS,
				"CARRIER_NAME": that.byId("carrier").getSelectedItem().getText(),
				"CARRIER_OTHERS": that.byId("specify").getValue(),
				"RGA_NUM": ShipmentDialogModel.getData().selectedShipment.RGA_NUM,
				"ADDR_NO": ShipmentDialogModel.getData().selectedShipment.ADDR_NO,
				"VENDOR_NAME": ShipmentDialogModel.getData().selectedShipment.VENDOR_NAME,
				"LABEL_COUNT": selectedItems.length + "",
				"TOTAL_COST": "0", //Must calculate in backend/not used?
				"CARRIER_ACCOUNT": that.byId("account").getValue(),
				"SCHEDULE_DATE": dateFormatted,
				"ADDRESS": that.byId("address").getValue(),
				"CITY1": that.byId("city").getValue(),
				"REGION": that.byId("province").getValue(),
				"COUNTRY": ShipmentDialogModel.getData().selectedShipment.COUNTRY,
				"NO_OF_CARTONS": that.byId("noOfCartons").getValue(),
				"TOTAL_WEIGHT": that.byId("totalWeight").getValue(),
				"SCHEDULE_SHIPMENT_DETAILSet": selectedItems.map(function (item) {
					return {
						"VENDOR": ShipmentDialogModel.getData().selectedShipment.VENDOR,
						"POSTAL_CODE": (ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/POSTAL_CODE")),
						"FRGHT_TERM_COD": that.byId("shippingTerm").getSelectedItem().getKey(),
						"CARRIER": that.byId("carrier").getSelectedItem().getKey(),
						"REASON_CODE": (ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/REASON_CODE")),
						"RGA_NUM": (ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/RGA_NUM")),
						"LABEL_NUM": (ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/LABEL_NUM")),
						"MATNR": (ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/MATNR")),
						"MAKTX": (ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/MAKTX")),
						"MENGE": (ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/MENGE")),
						"ITEM_COST": (ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/ITEM_COST")),
						"ADDR_LINE1_TXT": (ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/ADDR_LINE1_TXT")),
						"ADDR_NO": (ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/ADDR_NO")),
						"MEINS": (ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/MEINS")),
						"WEIGHT": (ShipmentDialogModel.getProperty(item.getBindingContextPath() + "/WEIGHT")),
					};
				}),
				"SCHEDULE_SHIPMENT_TRACK_NUMSet": that.byId("trackingId").getTokens().map(function (item) {
					return {
						"VENDOR": ShipmentDialogModel.getData().selectedShipment.VENDOR,
						"POSTAL_CODE": that.byId("postalCode").getValue(),
						"FRGHT_TERM_COD": that.byId("shippingTerm").getSelectedItem().getKey(),
						"CARRIER": that.byId("carrier").getSelectedItem().getKey(),
						"TRACK_NUM": item.getText(),
						"REASON_CODE": ShipmentDialogModel.getData().selectedShipment.REASON_CODE,
					};
				})
			};

			this.createShipment(payload);

		},

		createShipment: function (objectForShipment) {
			sap.ui.core.BusyIndicator.show();

			var oModel = this.getView().getModel();
			var that = this;

			oModel.create("/SCHEDULE_SHIPMENT_LISTSet",
				objectForShipment, {
					async: true,
					success: function (odata, response) {
						that.onRefreshPress();
						sap.ui.core.BusyIndicator.hide();
						MessageToast.show((that.getResourceBundle().getText("ShipmentDialog_CreationSuccess")), {
							duration: 4000,
							closeOnBrowserNavigation: false
						});
						//Now send to BOL
						that._openPDF(odata.SHIP_ID, that);
						that._oShipmentDialog.close();
					},
					error: function (oError, resp1, resp2) {
						sap.ui.core.BusyIndicator.hide();

						if (oError.responseText.indexOf('{"') !== -1) {
							var oErrorJSON = JSON.parse(oError.responseText);
							if (oErrorJSON.error.innererror.errordetails[0].code.slice(0, 3) == "ZPO") {
								var oErrorMsg = oErrorJSON.error.innererror.errordetails[0].message + "\n\n" + "Reference:";
								var skipFirst = "";

								oErrorJSON.error.innererror.errordetails.forEach(function (value, index, array) {
									if (skipFirst == "") {
										skipFirst = "X";
									} else {
										oErrorMsg = oErrorMsg + "\n" + value.message;
									}
								});

								sap.m.MessageBox.show(
									oErrorMsg, {
										icon: sap.m.MessageBox.Icon.ERROR,
										title: that.getResourceBundle().getText("Error"),
										actions: [sap.m.MessageBox.Action.OK],
										onClose: function (oAction) {}
									});

							} else {

								sap.m.MessageBox.show(
									oErrorJSON.error.message.value, {
										icon: sap.m.MessageBox.Icon.ERROR,
										title: that.getResourceBundle().getText("Error"),
										actions: [sap.m.MessageBox.Action.OK],
										onClose: function (oAction) {}
									});
							}
						} else {
							sap.m.MessageBox.show(
								JSON.parse(oError.responseText).error.message.value, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: that.getResourceBundle().getText("Error"),
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function (oAction) {}
								});
						}
						//that._oShipmentDialog.close();
					}
				});
		},

		onPressSave: function () {

		},

		onCreateNModifyShipmentCancel: function () {
			this._oShipmentDialog.close();
		},

		allowLettersNumbers: function (oEvent) {
			var regex = /^[A-Za-z0-9]*$/;
			var newValue = oEvent.getParameter("newValue");
			var message = this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_AlphaNumeric");
			if (!regex.test(newValue)) {
				oEvent.getSource().setValue(newValue.replace(/[^a-zA-Z0-9]/g, ''));
				MessageToast.show(message, {
					duration: 1200
				});
			}
		},

		allowAlphaNumric: function (oEvent) {
			var regex = /^[\w\s\-]*$/;
			var newValue = oEvent.getParameter("newValue");
			var message = this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_AlphaNumeric");
			if (!regex.test(newValue)) {
				oEvent.getSource().setValue(newValue.replace(/[^a-zA-Z0-9-_\s]/g, ''));
				MessageToast.show(message, {
					duration: 1200
				});
			}
		},

		allowAlphabets: function (oEvent) {
			var regex = /^[a-zA-Z]*$/;
			var newValue = oEvent.getParameter("newValue");
			var message = this.getView().getModel("WorkListi18n").getResourceBundle().getText("ShipmentDialog_Alphabets");
			if (!regex.test(newValue)) {
				oEvent.getSource().setValue(newValue.replace(/[^a-zA-Z]/g, ''));
				MessageToast.show(message, {
					duration: 1200
				});
			}
		},

		maxTwoCharacters: function (oEvent) {
			var newValue = oEvent.getParameter("newValue");
			if (newValue.length > 2) {
				oEvent.getSource().setValue(newValue.substring(0, 2));
			}
		},

		onExit: function () {
			BaseController.prototype.destroy.apply(this, arguments);
			var del = function (id) {
				if (sap.ui.getCore().byId(id)) {
					sap.ui.getCore().byId(id).destroy();
				}
				return del;
			};
			del("floor--FloorColumnListItem")("floor--PendingFloorColumnListItem")("floor--idFloorSearchFld")("destroy--idDestroySearchFld")
				(
					"destroy--DestroyColumnListItem")("destroy--ScannedColumnListItem");
		},

		onRefreshPressVendor: function (oEvent) {
			this.onRefreshPress();
		},

		onClickComment: function (oEvent) {

			var DestroyModel = this.getModel("DestroyModel");
			var sPath = oEvent.getSource().getParent().getParent().getBindingContextPath();

			if (sPath) {
				this._getPopover().bindElement({
					path: sPath
				});
			}
			var comment = DestroyModel.getProperty(sPath).COMMENTS;
			sap.ui.getCore().byId("idComment").setText(comment);
			this._getPopover().openBy(oEvent.getSource());
		},

		_getPopover: function () {

			if (!this._oPopover) {
				this._oPopover = sap.ui.xmlfragment("YRTV_ONE_TILE.YRTV_ONE_TILE.view.Worklist.CommentsPopover", this);
				this.getView().addDependent(this._oPopover);
			}
			return this._oPopover;
		},

		onCommentClose: function () {
			this._getPopover().close();
		},

		onSelectionChange: function (oEvent) {
			var destroyModel = this.getModel("DestroyModel");
			var oTable = sap.ui.getCore().byId("destroy--idDestroyPendingScannedTable");
			var PendingScanList = destroyModel.getData().PendingScanList;
			var rejectBtn = this.getView().byId("idRejectBtn");
			var completeBtn = this.getView().byId("idCompleteBtn");
			var donateBtn = this.getView().byId("idDonateBtn");

	        if (oEvent.getSource().getSelectedItems().length > 0) {
				donateBtn.setEnabled(true);
				completeBtn.setEnabled(true);
				rejectBtn.setEnabled(true);
	
			} else {
				donateBtn.setEnabled(false);
				completeBtn.setEnabled(false);
				rejectBtn.setEnabled(false);
			}
			
		}
	});
});