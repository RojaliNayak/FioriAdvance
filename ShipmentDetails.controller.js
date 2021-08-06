sap.ui.define([
	"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/Worklist/BaseController",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/Worklist/formatter",
	"sap/ui/core/routing/History",
	"sap/ui/core/format/DateFormat",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (BaseController, formatter, History, DateFormat, Dialog, Button, Text, MessageToast, MessageBox) {
	"use strict";

	var __controller__;

	return BaseController.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.Worklist.ShipmentDetails", {

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
				return this.DateFormat.format(new Date(value.getTime() + new Date().getTimezoneOffset() * 60000));
			}
		},

		onAfterRendering: function () {
			jQuery.sap.delayedCall(2000, this, function () {
				// this.getView().byId("idShipmentDetailsSearchFld").focus();
				this.onVKeypadHide();
			});
		},

		onInit: function () {
			__controller__ = this;
			this.siteId = "";
			this.byId("idPickupDate").setMinDate(new Date());
			this.getRouter().getRoute("shipmentDetails").attachPatternMatched(this._onShipmentDetailMatched, this);
			if (this.byId("shippingTerm").getValue().length > 0){
				this.byId("shippingTerm").setEnabled(false);
			}
		},

		_onShipmentDetailMatched: function (oEvent) {

			var oOtherCarrierIP = this.byId("idCarrierOtherIP"),
				oCarrierAccIP = this.byId("idCarrierAccIP"),
				oCarrierOtherTxt = this.byId("idCarrierOtherTxt"),
				oCarrierAccTxt = this.byId("idCarrierAccTxt"),
				oCarrierContTxt = this.byId("idCarrierContTxt"),
				oCarACTNumHbox = this.byId("idCarACTNumHbox"),
				oCarContctHbox = this.byId("idCarContctHbox"),
				oOtherCarNamHbox = this.byId("idOtherCarNamHbox");
			var oDeviceData = this.getModel("device").getData();
			var oPhone = oDeviceData.system.phone;
			if (oPhone) {
				oOtherCarrierIP.addStyleClass("fontShipmentNamePhone");
				oCarrierAccIP.addStyleClass("fontShipmentNamePhone");
				oCarrierOtherTxt.addStyleClass("fontShipmentNamePhone");
				oCarrierAccTxt.addStyleClass("fontShipmentNamePhone");
				oCarrierContTxt.addStyleClass("fontShipmentNamePhone");
				oOtherCarNamHbox.addStyleClass("sapUiResponsiveMargin");
				oCarACTNumHbox.addStyleClass("sapUiResponsiveMargin spaceCustomCarrierNumPhone");
				oCarContctHbox.addStyleClass("sapUiResponsiveMargin spaceCustomCarrierContPhone");
			} else {
				oOtherCarrierIP.addStyleClass("fontShipmentNamePC");
				oCarrierAccIP.addStyleClass("fontShipmentNamePC");
				oCarrierOtherTxt.addStyleClass("fontShipmentNamePC");
				oCarrierAccTxt.addStyleClass("fontShipmentNamePC");
				oCarrierContTxt.addStyleClass("fontShipmentNamePC");
				oOtherCarNamHbox.addStyleClass("sapUiResponsiveMargin spaceCustomOTCarrier");
				oCarACTNumHbox.addStyleClass("sapUiResponsiveMargin spaceCustomCarrierNumDesk");
				oCarContctHbox.addStyleClass("sapUiResponsiveMargin spaceCustomCarrierContDesk");
			}

			this._AuthorizationVerifyAccess();
			jQuery.sap.require("jquery.sap.storage");
			var oView = this.getView();
			var oParameters = oEvent.getParameters();
			var vendorModel = this.getModel("VendorModel");

			var vendorModelData = vendorModel.getData();
			var searchFld = oView.byId("idShipmentDetailsSearchFld");
			searchFld.setValue("");
			var completeBtn = oView.byId("idCompleteBtn");
			var printBOLBtn = oView.byId("idPrintBOLBtn");
			var confirmBtn = oView.byId("idConfirmBtn");

			if (sap.ui.Device.system.desktop)
				oView.byId('idPanelVendorAddress').setExpanded(true);
			else
				oView.byId('idPanelVendorAddress').setExpanded(false);
			completeBtn.setEnabled(false);
			printBOLBtn.setEnabled(true);
			confirmBtn.setEnabled(true);

			if (oParameters.name === "shipmentDetails") {
				this.siteId = oParameters.arguments.site;
				if (vendorModelData.VendorList.length === 0) {
					this.getVendorModelData(oParameters);
				} else {
					var oScanField = this.getView().byId("idShipmentDetailsSearchFld"),
						oSId = oScanField.getId();
					this.onScanField(oSId);
					this.loadShipmentDetails(oParameters, this);
				}
			}
			this.getVendorAddress(oParameters, this);
		},

		getVendorModelData: function (oParameters) {
			var vendorModel = this.getView().getModel("VendorModel");
			var vendorList = vendorModel.getData().VendorList;
			// var labelModel = this.getModel("labelModel");
			var labelModel = this.getOwnerComponent().getModel();
			vendorList.RTVLabel = [];
			vendorList.pendingScan = [];
			vendorList.scanLabels = [];
			var busyDialog = new sap.m.BusyDialog();
			busyDialog.open();
			this._loadCount();

			//Filters for Vendor
			var oFilters = [
				new sap.ui.model.Filter("WERKS", "EQ", this.siteId),
				new sap.ui.model.Filter("APP_SRC", "EQ", "VENDOR")
			];
			var that = this;
			labelModel.read("/WLLabelSet", {
				filters: oFilters,
				success: function (oData) {
					busyDialog.close();
					var duplicate = false;
					if (oData.results.length > 0) {
						that.siteId = oData.results[0].WERKS;
					}
					oData.results.forEach(function (item) {
						vendorList.forEach(function (vendorItem) {
							if (vendorItem.SHIP_ID === item.SHIP_ID) {
								duplicate = true;
							}
						});
						if (!duplicate) {
							item.RTVLabel = [item];
							item.AGG_ITEM_COST = parseFloat(item.MENGE) * parseFloat(item.ITEM_COST);
							vendorList.push(item);
						} else {
							vendorList.some(function (vendorListItem, index, array) {
								if (vendorListItem.SHIP_ID === item.SHIP_ID) {
									vendorListItem.RTVLabel.push(item);
									vendorListItem.AGG_ITEM_COST = vendorListItem.AGG_ITEM_COST + parseFloat(item.MENGE) * parseFloat(item.ITEM_COST);
									return true;
								}
							}.bind(this));
						}
						duplicate = false;
					});
					vendorModel.checkUpdate(true);
					that.getView().getModel("VendorModel").updateBindings(true);

					that.loadShipmentDetails(oParameters, that);

				},
				error: function (oError) {
					busyDialog.close();
					that.serviceError(oError);
				}
			});
		},

		_loadCount: function () {
			// var labelModel = this.getModel("labelModel");
			var labelModel = this.getOwnerComponent().getModel();
			var vendorModel = this.getView().getModel("VendorModel");
			var that = this;
			labelModel.callFunction("/GET_COUNT", {
				urlParameters: {
					"WERKS": this.siteId
				},
				success: function (oData) {
					that.siteId = oData.WERKS;
					vendorModel.setProperty("/Count", {
						VENDOR_NUM: parseInt(oData.VENDOR_NUM),
						VENDOR_DEN: parseInt(oData.VENDOR_DEN),
						SYSTEM_DATE: oData.SYSTEM_DATE
					});
					vendorModel.updateBindings(true);
				},
				error: function () {}
			});
		},

		loadShipmentDetails: function (oParameters, that) {
			var completeBtn = this.getView().byId("idCompleteBtn");
			var printBOLBtn = this.getView().byId("idPrintBOLBtn");
			var confirmBtn = this.getView().byId("idConfirmBtn");
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				sData = oAuthModel.getData();
			var updateShipmentBtn = this.getView().byId("idUpdateShipmentBtn");
			var vendorModel = this.getModel("VendorModel");
			var sPath = -1; //oParameters.arguments.shipmentID;
			var shipID = oParameters.arguments.shipmentID;
			var shipArray = vendorModel.getProperty("/VendorList");
			this.getOwnerComponent().googleAnalyticUpdate({
				page: "Vendor Shipment Details",
				site: this.siteId
			}); //Google Analytics
			this.onAfterRendering();
			// var carrierModel = this.getModel("labelModel");
			var carrierModel = this.getOwnerComponent().getModel();
			var aFilters = [
				new sap.ui.model.Filter("WERKS", "EQ", this.siteId), //changes for siteID
				new sap.ui.model.Filter("SHIP_ID", "EQ", shipID)
			];

			carrierModel.read("/WLCarrierSet", {
				filters: aFilters,
				success: function (oData) {
					vendorModel.setProperty("/CarrierList", oData.results);
					vendorModel.updateBindings(true);
				},
				error: function () {}
			});
			for (var i = 0; i < shipArray.length; i++) {
				if (shipID === shipArray[i].SHIP_ID) {
					sPath = i;
					break;
				}
			}
			if (sPath === -1) {
				that.getOwnerComponent()._message = "Shipment " + shipID + " was deleted";
				var pickupDate = this.getView().byId("idPickupDate");
				pickupDate.setValueState("None");
				that.getRouter().navTo("worklist_tab", {
					selectedKey: "vendor"
				}, true);

				completeBtn.setVisible(
					sData.results.some(function (item) {
						return (item.Vendor === "Y");
					})
				);
				printBOLBtn.setVisible(false);
				confirmBtn.setEnabled(false);
				updateShipmentBtn.setVisible(false);
			}

			this.shipmentPath = sPath;
			this.getView().bindObject("VendorModel>/VendorList/" + sPath);
			var shipmentDueDateText = this.getView().byId('idShipmentDueDate');
			var systemDate = this.getView().getModel("VendorModel").getData().Count.SYSTEM_DATE;

			var dataObj = vendorModel.getData().VendorList[sPath];
			//Carrier
			var oOtherCarrierIP = this.byId("idCarrierOtherIP"),
				oCarrierAccIP = this.byId("idCarrierAccIP"),
				oCarrierOtherTxt = this.byId("idCarrierOtherTxt"),
				oCarrierAccTxt = this.byId("idCarrierAccTxt"),
				oCarrierSelect = this.byId("idCarrierSelect"),
				oCarrier = dataObj.CARRIER;
			// Carrier Name
			if (dataObj.STATUS === "400") {
				if ((dataObj.CARRIER === "") || (dataObj.CARRIER === "OT")) {
					if (dataObj.CARRIER_OTHERS !== "") {
						oCarrierSelect.setSelectedItem(oCarrier);
						oCarrierSelect.setEnabled(false);
						oOtherCarrierIP.setVisible(false);
						oCarrierOtherTxt.setVisible(true);
					} else {
						oCarrierSelect.setEnabled(true);
						oOtherCarrierIP.setVisible(true);
						oCarrierOtherTxt.setVisible(false);
					}

				} else {
					oOtherCarrierIP.setVisible(true);
					oOtherCarrierIP.setEnabled(false);
					oCarrierOtherTxt.setVisible(false);

				}

				// Carrier Account
				if (dataObj.CARRIER_ACCOUNT !== "") {
					oCarrierAccIP.setVisible(false);
					oCarrierAccTxt.setVisible(true);
				} else {
					oCarrierAccIP.setVisible(true);
					oCarrierAccIP.setEnabled(true);
					oCarrierAccTxt.setVisible(false);
				}
			}

			if (dataObj.STATUS === "410") {
				oCarrierSelect.setSelectedItem(oCarrier);
				oCarrierSelect.setEnabled(false);
				oOtherCarrierIP.setVisible(false);
				oCarrierOtherTxt.setVisible(true);
				oCarrierAccIP.setVisible(false);
				oCarrierAccTxt.setVisible(true);

			}
			// var shipmentDueDate = this.Date2NumFormat.format(dataObj.DUE_DATE);
			var shipmentDate = dataObj.DUE_DATE;

			var pendingScanLabelNumber = this.getView().byId("PendingScanLabelNumber");
			var scannedLabelNumber = this.getView().byId("ScannedLabelNumber");
			if (dataObj.CARRIER) {
				this.byId("idCarrierSelect").setSelectedKey(dataObj.CARRIER);
			} else {
				this.byId("idCarrierSelect").setSelectedItem(new sap.ui.core.Item({
					key: ""
				}));
			}

			var aDate = systemDate.slice(4, 6) + "/" + systemDate.slice(6, 8) + "/" + systemDate.slice(0, 4);
			var bDate = shipmentDate.slice(4, 6) + "/" + shipmentDate.slice(6, 8) + "/" + shipmentDate.slice(0, 4);
			var today = new Date(aDate);
			var shipmentDueDate = new Date(bDate);

			if (shipmentDueDate <= today) {
				shipmentDueDateText.addStyleClass('dueDateColor');
			} else {
				shipmentDueDateText.removeStyleClass('dueDateColor');
			}

			var labelNumberDelegate = {
				onAfterRendering: function () {
					var labelNum = this.getBindingContext("VendorModel").getObject().LABEL_NUM;

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

			pendingScanLabelNumber.addDelegate(labelNumberDelegate, false, pendingScanLabelNumber, true); 
			scannedLabelNumber.addDelegate(labelNumberDelegate, false, scannedLabelNumber, true); 

			// var searchFld = this.byId("idShipmentDetailsSearchFld");
			// var searchFldDelegate = {
			// 	onAfterRendering: function () {
			// 		if (sap.ui.Device.system.phone) {
			// 			$('#' + this.byId("idShipmentDetailsSearchFld").getId() + '-I').attr('type', 'number');
			// 		}
			// 	}.bind(this)
			// };
			// searchFld.addDelegate(searchFldDelegate, true, searchFld, true);

			if (dataObj.PICKUP_DATE === "00000000") {
				completeBtn.setVisible(
					sData.results.some(function (item) {
						return (item.Vendor === "Y");
					})
				);
				printBOLBtn.setVisible(false);
				confirmBtn.setVisible(false);
				updateShipmentBtn.setVisible(false);
				dataObj.pendingScan = [];
				dataObj.RTVLabel.forEach(function (item, index) {
					dataObj.pendingScan.push({
						MAKTX: item.MAKTX,
						MATNR: item.MATNR,
						MENGE: item.MENGE,
						MEINS: item.MEINS,
						ITEM_COST: item.ITEM_COST,
						LABEL_NUM: item.LABEL_NUM,
						WEIGHT: item.WEIGHT
					});
				});
				dataObj.scanLabels = [];
			} else {
				this._getTrackingId(dataObj);
				completeBtn.setVisible(false);
				printBOLBtn.setVisible(
					sData.results.some(function (item) {
						return (item.Vendor === "Y");
					})
				);
				confirmBtn.setVisible(
					sData.results.some(function (item) {
						return (item.Vendor === "Y");
					})
				);
				updateShipmentBtn.setVisible(
					sData.results.some(function (item) {
						return (item.Vendor === "Y");
					})
				);
				dataObj.scanLabels = [];
				dataObj.RTVLabel.forEach(function (item, index) {
					dataObj.scanLabels.push({
						MAKTX: item.MAKTX,
						MATNR: item.MATNR,
						MENGE: item.MENGE,
						MEINS: item.MEINS,
						ITEM_COST: item.ITEM_COST,
						LABEL_NUM: item.LABEL_NUM,
						WEIGHT: item.WEIGHT
					});
				});
				dataObj.pendingScan = [];
			}
			vendorModel.checkUpdate(true);
		},
		fnSetVendorAddressEditable: function (status) {
			if (status == '400') return true;
			else return false;
		},
		getVendorAddress: function (oParameters, that) {
			var oModel = this.getModel();
			var vendorAddressModel = this.getOwnerComponent().getModel("VendorAddressModel");

			var shipID = oParameters.arguments.shipmentID;

			var busyDialog = new sap.m.BusyDialog();
			busyDialog.open();

			var list = this.byId("addr_region");
			var listBinding = list.getBindingInfo("items");

			sap.ui.core.BusyIndicator.show();

			var aFilters = [
				new sap.ui.model.Filter("WERKS", "EQ", this.siteId), //changes for siteID
				new sap.ui.model.Filter("SHIP_ID", "EQ", shipID)
			];

			oModel.read("/VendorAddressSet", {
				filters: aFilters,
				success: function (oData, response) {
					vendorAddressModel.setProperty('/VendorAddress', oData.results[0]);
					busyDialog.close();
					if (oData.COUNTRY === "US") {
						listBinding.path = "/US_REGIONS";
					} else {
						listBinding.path = "/CA_REGIONS";
					}
					list.bindItems(listBinding);
				},
				error: function (oError) {
					busyDialog.close();
				}
			});

			this._us_regions = this.getModel("VendorAddressModel").getProperty("/US_REGIONS");
			this._ca_regions = this.getModel("VendorAddressModel").getProperty("/CA_REGIONS");

			if ((!this._us_regions) || (!this._ca_regions)) {
				var aFilters_Region = [
					new sap.ui.model.Filter("LAND1", "EQ", "US")
				];
				var sRead = "/MetRegionSet";
				oModel.read(sRead, {
					filters: aFilters_Region,
					success: function (oData) {
						this.getModel("VendorAddressModel").setProperty("/US_REGIONS", oData.results);
					}.bind(this),
					error: function () {}
				});

				aFilters_Region = [
					new sap.ui.model.Filter("LAND1", "EQ", "CA")
				];
				oModel.read(sRead, {
					filters: aFilters_Region,
					success: function (oData) {
						this.getModel("VendorAddressModel").setProperty("/CA_REGIONS", oData.results);
					}.bind(this),
					error: function () {}
				});
			}
		},

		onCountryChange: function (oEvent) {
			var COUNTRY = oEvent.getSource().getProperty("selectedKey");
			var list = this.byId("addr_region");
			var b = list.getBindingInfo("items");
			if (COUNTRY === "US") {
				b.path = "/US_REGIONS";
			} else {
				b.path = "/CA_REGIONS";
			}
			list.bindItems(b);
			this.onVendorAddressEdit();
		},

		_getTrackingId: function (dataObj) {
			// var labelModel = this.getModel("labelModel");
			var labelModel = this.getOwnerComponent().getModel();
			var vendorModel = this.getModel("VendorModel");
			var oFilters = [
				new sap.ui.model.Filter("WERKS", "EQ", dataObj.WERKS),
				new sap.ui.model.Filter("SHIP_ID", "EQ", dataObj.SHIP_ID)
			];
			var trackIdArray;
			dataObj.TrackingIds = [];
			labelModel.read("/WLShipHeaderSet", {
				filters: oFilters,
				urlParameters: {
					"$expand": "shiptrackset"
				},
				success: function (oData) {
					dataObj.NoOfCartons = parseInt(oData.results[0].CARTON_COUNT);
					trackIdArray = oData.results[0].shiptrackset.results;
					if (trackIdArray.length === 0) {
						trackIdArray.push({
							TRACK_NUM: ""
						});
						dataObj.ValidIds = false;
					}
					trackIdArray.forEach(function (element, index, array) {
						dataObj.TrackingIds.push({
							TrackingId: element.TRACK_NUM
						});
					});
					if (dataObj.TrackingIds[0].TrackingId.length !== 0) {
						dataObj.ValidIds = true;
					}
					vendorModel.updateBindings(true);
				},
				error: function () {}
			});
		},

		setupTabHandling: function () {
			var oDialog = $('#' + this._oDialog.getId()),
				oList = this._oDialog.getContent()[1],
				that = this;
			sap.ui.getCore().byId("carton--idCartonQty").setValueState("None");
			oDialog.focusin(function () {
				// remember current focused cell
				jQuery.sap.delayedCall(100, null, function () {
					// find the focused label
					// var oLabel = $("#carton--idCartonList").find(".sapMLabel")[0];
					// sap.ui.getCore().byId(oLabel.id).setRequired(true).addStyleClass("labelMargin");
					// find the focused input field
					var oField = $("#carton--idCartonList").find(".sapMInputFocused")[0];
					if (oField) {
						// store ID of focused cell
						that._FieldID = oField.id;
					} else {
						that._FieldID = "carton--idCartonQty";
					}
				});
			});

			oDialog.on("keydown", function (evt) {
				if (evt.which != jQuery.sap.KeyCodes.TAB || !that._FieldID) {
					// Not a tab key or no field focused
					return;
				}
				var aRows = oList.getItems();
				if (that._FieldID !== 'carton--idCartonQty') {
					var oSelectedField = sap.ui.getCore().byId(that._FieldID);
					var oRow = oSelectedField.getParent().getParent();
					var iItems = aRows.length;

					var oTargetCell, thisRow;
					thisRow = oList.indexOfItem(oRow);
					var bIsFirstRow = thisRow <= 0;
					var bIsLastRow = thisRow >= iItems - 1;

					if (!evt.shiftKey) {
						if (bIsLastRow) {
							// 1. Tabbing to next input field within a row works, no need to handle it here
							// 2. last row: Let default handling take care of focusing the next element after the table
							return;
						}

						// jump to next row
						oTargetCell = aRows[thisRow + 1].getContent()[0].getItems()[1];

					} else {
						if (bIsFirstRow) {
							// 1. Tabbing to previous input field within a row works, no need to handle it here
							// 2. First row: Let default handling take care of focusing the previous element before the table
							return;
						}

						// jump to previous row
						oTargetCell = aRows[thisRow - 1].getContent()[0].getItems()[1];
					}
				} else {
					oTargetCell = aRows[0].getContent()[0].getItems()[1];
				}
				oTargetCell.focus();
				that._FieldID = oTargetCell.getId();

				// Prevent any subsequent handling of this key press
				evt.preventDefault();
				evt.stopPropagation();
			});
		},

		onShipmentComplete: function () {
			var shipmentDueDateText = this.getView().byId('idPickupDate');
			if (shipmentDueDateText.getValue() !== null) {
				shipmentDueDateText.setValueState("None");
				if (!this._oDialog) {
					this._oDialog = sap.ui.xmlfragment("carton", "com.hd.rtvworklist.view.CartonDetails", this);
					this.getView().addDependent(this._oDialog);
					// this._oDialog.addEventDelegate({
					// 	onAfterRendering: this.setupTabHandling
					// }, this);
				}
				var oView = this.getView();
				var bindObj = oView.getBindingContext("VendorModel").getObject();
				bindObj.task = "Complete";
				bindObj.NoOfCartons = "";
				bindObj.ValidIds = true;
				bindObj.TrackingIds = [{
					TrackingId: ""
				}];
				this._oDialog.open();
			} else {
				shipmentDueDateText.setValueState("Error");
			}
		},

		onCartonDetailsCancel: function () {

			var bindObj = this._oDialog.getBindingContext("VendorModel").getObject();
			var pickupDate = this.getView().byId("idPickupDate").getValue();
			if (bindObj.task === "Update") {
				bindObj.NoOfCartons = bindObj.oldTrackingDetails.NoOfCartons;
				bindObj.TrackingIds = bindObj.oldTrackingDetails.TrackingIds;
				bindObj.ValidIds = bindObj.oldTrackingDetails.ValidIds;
			} else {
				bindObj.NoOfCartons = "";
				bindObj.TrackingIds = [{
					TrackingId: ""
				}];
				if (pickupDate) {
					var oPickupDate = pickupDate.slice(6, 10) + pickupDate.slice(0, 2) + pickupDate.slice(3, 5);
					bindObj.PICKUP_DATE = oPickupDate;
				}
			}
			// this.getView().getModel("VendorModel").checkUpdate(true);
			this._oDialog.destroy();
			this._oDialog = null;
		},

		onCartonDetailsSubmit: function () {
			var bindObj = this.getView().getBindingContext("VendorModel").getObject();
			if (bindObj.task === "Complete") {
				this._onTaskComplete();
			} else {
				this._onTaskUpdate();
			}
		},

		onTrackingNoChange: function (evt) {
			var trackingIdFld = evt.getSource();
			var TrackingIds = this._oDialog.getBindingContext("VendorModel").getObject().TrackingIds;

			var TrackingIdValues = TrackingIds.map(function (item) {
				return item.TrackingId;
			});
			var bindObj = this._oDialog.getBindingContext("VendorModel").getObject();
			var pickupDate = this.getView().byId("idPickupDate").getValue();
			if (TrackingIdValues.some(function (item, idx) {
					if (item.length !== 0 && item !== "") {
						return TrackingIdValues.indexOf(item) != idx;
					}
				})) {
				bindObj.ValidIds = false;
				trackingIdFld.setValueState("Error");
				trackingIdFld.rerender();

				sap.m.MessageBox.error(
					this.getResourceBundle().getText("DuplicateTrackingNumWarning"), {
						actions: [MessageBox.Action.OK]
					}
				);

			} else {
				if (pickupDate) {
					var oPickupDate = pickupDate.slice(6, 10) + pickupDate.slice(0, 2) + pickupDate.slice(3, 5);
					bindObj.PICKUP_DATE = oPickupDate;
				}
				trackingIdFld.setValueState("None");
				bindObj.ValidIds = true;
			}

		},

		_onTaskUpdate: function () {

			var oView = this.getView();
			// var labelModel = this.getModel("labelModel");
			var labelModel = this.getOwnerComponent().getModel();
			var bindObj = oView.getBindingContext("VendorModel").getObject();
			var updateShipmentBtn = oView.byId("idUpdateShipmentBtn");
			var printBolBtn = oView.byId("idPrintBOLBtn");
			var confirmBtn = oView.byId("idConfirmBtn");
			var carrier = oView.byId("idCarrierSelect").getSelectedKey();
			var updatePayload = {
				"SHIP_ID": bindObj.SHIP_ID,
				"WERKS": bindObj.WERKS,
				"PICKUP_DATE": "",
				"CARRIER": carrier,
				"CARTON_COUNT": (bindObj.NoOfCartons).toString(),
				"ACTION": "UPDATE",
				"labelset": [],
				"shiptrackset": []
			};
			// bindObj.NEW_PICKUP_DATE = bindObj.NEW_PICKUP_DATE.replace("/", "-").replace("/", "-");
			// updatePayload.PICKUP_DATE = bindObj.NEW_PICKUP_DATE.split("-")[2] + bindObj.NEW_PICKUP_DATE.split("-")[0] + bindObj.NEW_PICKUP_DATE
			// 	.split("-")[1];
			updatePayload.PICKUP_DATE = bindObj.PICKUP_DATE.slice(6,10) + bindObj.PICKUP_DATE.slice(0,2) + bindObj.PICKUP_DATE.slice(3,5);
			bindObj.TrackingIds.forEach(function (element, index, array) {
				updatePayload.shiptrackset.push({
					"SHIP_ID": bindObj.SHIP_ID,
					"TRACK_NUM": element.TrackingId
				});
			});
			bindObj.scanLabels.forEach(function (element, index, array) {
				updatePayload.labelset.push({
					"LABEL_NUM": element.LABEL_NUM,
					"WERKS": bindObj.WERKS,
					"WEIGHT": element.WEIGHT
				});
			});
			var that = this;
			labelModel.create("/WLShipHeaderSet", updatePayload, {
				success: function (odata, response) {
					that._oDialog.close();
					updateShipmentBtn.setEnabled(false);
					printBolBtn.setEnabled(true);
					confirmBtn.setEnabled(true);
					that.onNavBack();
					that._openPDF(bindObj.SHIP_ID, that);
				},
				error: function (response) {
					updateShipmentBtn.setEnabled(true);
					sap.m.MessageBox.error(
						JSON.parse(response.responseText).error.message.value, {
							actions: [MessageBox.Action.OK]
						}
					);
				}
			});
		},

		_onTaskComplete: function () {

			this._oDialog.close();
			// var oModel = this.getModel("labelModel");
			var oModel = this.getOwnerComponent().getModel();
			var completeBtn = this.getView().byId("idCompleteBtn");
			var updateShipmentBtn = this.getView().byId("idUpdateShipmentBtn");
			var printBOL = this.getView().byId("idPrintBOLBtn");
			var confirmBtn = this.getView().byId("idConfirmBtn");
			var oView = this.getView();
			var bindObj = oView.getBindingContext("VendorModel").getObject();
			var carrier = oView.byId("idCarrierSelect").getSelectedKey();
			var that = this;
			var errorMsg = [];

			var completePayload = {
				"SHIP_ID": bindObj.SHIP_ID,
				"WERKS": bindObj.WERKS,
				"PICKUP_DATE": "",
				"CARRIER": carrier,
				"CARRIER_ACCOUNT": bindObj.CARRIER_ACCOUNT,
				"CARRIER_OTHERS": bindObj.CARRIER_OTHERS,
				"CARTON_COUNT": (bindObj.NoOfCartons).toString(),
				"ACTION": "COMPLETE",
				"labelset": [],
				"shiptrackset": [],
				"vendoraddressset": []
			};
			completePayload.PICKUP_DATE = bindObj.NEW_PICKUP_DATE.split("/")[2] + bindObj.NEW_PICKUP_DATE.split("/")[0] + bindObj.NEW_PICKUP_DATE
				.split("/")[1];
			bindObj.TrackingIds.forEach(function (element, index, array) {
				completePayload.shiptrackset.push({
					"SHIP_ID": bindObj.SHIP_ID,
					"TRACK_NUM": element.TrackingId
				});
			});
			bindObj.scanLabels.forEach(function (element, index, array) {
				completePayload.labelset.push({
					"LABEL_NUM": element.LABEL_NUM,
					"WERKS": bindObj.WERKS,
					"WEIGHT": element.WEIGHT
				});
			});
			completePayload.vendoraddressset.push(this.getOwnerComponent().getModel("VendorAddressModel").getProperty('/VendorAddress'));
			oModel.create("/WLShipHeaderSet", completePayload, {
				success: function (odata, response) {
					completeBtn.setVisible(false);
					printBOL.setVisible(true);
					confirmBtn.setVisible(true);
					updateShipmentBtn.setVisible(true);
					updateShipmentBtn.setEnabled(false);
					bindObj.PICKUP_DATE = bindObj.NEW_PICKUP_DATE.split("/")[2] + "-" + bindObj.NEW_PICKUP_DATE.split("/")[0] + "-" + bindObj.NEW_PICKUP_DATE
						.split("/")[1];
					oView.getModel("VendorModel").checkUpdate(true);
					that.onNavBack();
					that._openPDF(completePayload.SHIP_ID, that);
				},
				error: function (response) {
					if (response.responseText.indexOf('{"') !== -1) {
						var errorResponse = JSON.parse(response.responseText);
						var respMsg = errorResponse.error.innererror;

						for (var k = 0; k < respMsg.errordetails.length; k++) {
							if (respMsg.errordetails[k].severity === "error" && respMsg.errordetails[k].code.indexOf("IWBEP") === -1 && respMsg.errordetails[
									k].message !== "") {
								if (errorMsg.length === 0) {
									errorMsg.push(that.getResourceBundle().getText("infoMsgP1") + '\n');
									errorMsg.push('\n' + errorMsg.length + ". " + respMsg.errordetails[k].message + '\n');
								} else {
									errorMsg.push(errorMsg.length + ". " + respMsg.errordetails[k].message + '\n');
								}
							}
						}
						if (errorMsg.length > 0) {
							errorMsg.push('\n' + that.getResourceBundle().getText("infoMsgP2"));
							var message = (errorMsg.toString()).replace(/,/g, " ");
							sap.m.MessageBox.information( //changed from Error to Information
								message, {
									actions: [MessageBox.Action.OK],
									onClose: function () {
										location.reload();
										errorMsg = [];
									}
								}
							);
						}
					}
				}
			});

		},

		_openPDF: function (shipId, that) {
			// var oModel = this.getModel("labelModel");
			var oModel = this.getOwnerComponent().getModel();
			var serviceUrl = oModel.sServiceUrl;
			/*if(!this.getModel("device").getData().system.phone)
			{*/
			var sPath = serviceUrl + "/WLBOL_PDFSet(SHIP_ID='" + shipId + "',WERKS='" + that.siteId + "')/$value";
			// window.open(sPath);
			//}

			//new code
			var oUrl;
			if (sap.ui.Device.system.phone) {
				oUrl = "/sap/bc/ui5_ui5/sap/yrtv_pdfjs/js/web/viewer.html?file=" + encodeURIComponent(sPath);
			} else {
				oUrl = sPath;
			}

			sap.m.URLHelper.redirect(oUrl, true);
		},

		onLabelScan: function (oEvent) {
			var sValue = oEvent.getSource().getValue();
			if (sValue.length >= 17) {
				oEvent.getSource().setValue("");
				this.onSearchLabel(oEvent, sValue);
			}

		},

		onSearchLabel: function (oEvent, sValue) {
			var oView = this.getView();
			var sQuery;
			if (oEvent.getParameter("query")) {
				sQuery = oEvent.getParameter("query").trim();
			}

			if (oEvent.getParameter("newValue")) {
				sQuery = oEvent.getParameter("newValue").trim();
			}

			if ((sQuery === "") || (!sQuery)) {
				sQuery = oEvent.getSource().getValue();
			}

			if (sValue) {
				sQuery = sValue;
			}

			if (sQuery === "") {
				return;
			}

			oEvent.getSource().setValue("");

			var sId = oEvent.getParameter("id");
			var regExp = /^[9][8][1][8][1-4][0-9]{12}$/;
			var that = this;
			var pickupDateFld = this.getView().byId("idPickupDate");
			var oMsg = this.getResourceBundle().getText("Scanned");
			// var oScannedTable = this.getView().byId("idShipmentDetailsScanTable"),
			//     oTableRows;

			if (regExp.test(sQuery)) {
				var pendingScanList = this.getView().getBindingContext("VendorModel").getObject().pendingScan;
				var scanLabelList = this.getView().getBindingContext("VendorModel").getObject().scanLabels;

				if (scanLabelList.some(function (item, i) {
						return item.LABEL_NUM === sQuery;
					})) {
					this.onMessageDialog("error", this.getResourceBundle().getText("labelAlreadyScannedMsg"), this);
					return;
				}
				if (!pendingScanList.some(function (item, i) {
						if (item && item.LABEL_NUM === sQuery) {
							scanLabelList = scanLabelList.concat(pendingScanList.splice(i, 1));
							MessageToast.show(oMsg);
							// that.enableCompleteButton(scanLabelList, pendingScanList);
							return true;
						}
					})) {
					this.onMessageDialog("error", this.getResourceBundle().getText(
						"TheLabelIsNotInVendorStatus"), this);
					return;
				}
				oView.getBindingContext("VendorModel").getObject().scanLabels = scanLabelList;
				oView.getModel("VendorModel").checkUpdate(true);
				oView.byId("idShipmentDetailsScanTable").rerender();
				oView.byId("idShipmentDetailsPendingScanTable").rerender();
				// this.enableCompleteButton();
				if (pickupDateFld.getBindingContext("VendorModel").getObject().NEW_PICKUP_DATE !== undefined) {
					pickupDateFld.setDateValue(new Date(pickupDateFld.getBindingContext("VendorModel").getObject().NEW_PICKUP_DATE));
				}
			} else {
				this.onMessageDialog("error", this.getResourceBundle().getText("validRTVMsg"), this);
			}
			// oTableRows = scanLabelList.length;
			// oScannedTable.setVisibleRowCount(oTableRows);
			this.enableCompleteButton();
		},

		enableCompleteButton: function () {

			var viewData = this.getView().getBindingContext("VendorModel").getObject();
			var scanLabelList = viewData.scanLabels;
			var pendingScanList = viewData.pendingScan;
			var completeBtn = this.getView().byId("idCompleteBtn");
			var pickupDateFld = this.getView().byId("idPickupDate");
			var carrier = this.getView().byId("idCarrierSelect"),
				oCarrierAccIP = this.byId("idCarrierAccIP"),
				oCarrierAcc = oCarrierAccIP.getValue();
			var oAccuntFld;

			if (viewData.FRGHT_TERM_COD === "C") {
				if (oCarrierAcc === "") {
					oAccuntFld = false;
				} else {
					oAccuntFld = true;
				}
			} else {
				oAccuntFld = true;
			}
			var VendorAddress = this.getView().getModel('VendorAddressModel').getProperty("/VendorAddress");
			if ((carrier._getSelectedItemText() || viewData.CARRIER) && pickupDateFld.getValue().length !== 0 && pickupDateFld.getValueState() !==
				"Error" && oAccuntFld === true && pendingScanList.length === 0 && !scanLabelList.some(function (element, index, array) {
					if (Number(element.WEIGHT) <= 0) {
						return true;
					}
				}) && VendorAddress.ADDR_LINE1_TXT !== "" && VendorAddress.CITY1 !== "" && VendorAddress.COUNTRY !== "" && VendorAddress.POST_CODE_1 !==
				"") {
				completeBtn.setEnabled(true);
			} else {
				completeBtn.setEnabled(false);
			}

			if ((carrier.getSelectedKey() === "OT") && viewData.CARRIER_OTHERS === "") {
				completeBtn.setEnabled(false);
			}
		},
		onVendorAddressEdit: function () {
			if (this.getView().byId('idCompleteBtn').getVisible())
				this.enableCompleteButton();
		},
		onPrintBOL: function () {
			var bindObj = this.getView().getBindingContext("VendorModel").getObject();
			var shipId = bindObj.SHIP_ID;
			this._openPDF(shipId, this);
		},
		onConfirm: function () {
			var oView = this.getView();
			var labelModel = this.getOwnerComponent().getModel();
			var bindObj = oView.getBindingContext("VendorModel").getObject();
			var updateShipmentBtn = oView.byId("idUpdateShipmentBtn");
			var printBolBtn = oView.byId("idPrintBOLBtn");
			var confirmBtn = oView.byId("idConfirmBtn");
			var updatePayload = {
				"SHIP_ID": bindObj.SHIP_ID,
				"WERKS": bindObj.WERKS,
				"ACTION": "C",
				"PICKUP_DATE":bindObj.PICKUP_DATE
			};
			var that = this;
			labelModel.create("/WLShipHeaderSet", updatePayload, {
				success: function (odata, response) {
					updateShipmentBtn.setEnabled(false);
					printBolBtn.setEnabled(true);
					confirmBtn.setEnabled(false);
					that.onNavBack();
					that._openPDF(bindObj.SHIP_ID, that);
				},
				error: function (response) {
					updateShipmentBtn.setEnabled(true);
					sap.m.MessageBox.error(
						JSON.parse(response.responseText).error.message.value, {
							actions: [MessageBox.Action.OK]
						}
					);
				}
			});

		},
		onQtyLiveChange: function (evt) {
			var qtyFld = evt.getSource();
			var qty = qtyFld.getValue();
			qty = qty.replace(/[^\d.]/g, "");
			qtyFld.updateDomValue(qty);
		},
		onCartonQty: function (evt) {

			var qtyFld = evt.getSource();
			var qty = qtyFld.getValue();
			qty = qty.replace(/[^\d.]/g, "");
			qtyFld.updateDomValue(qty);
			var regEx = /^[1-9]$/;
			// var pickupDate = this.getView().byId("idPickupDate").getValue();
			var bindObj = qtyFld.getBindingContext("VendorModel").getObject();
			// bindObj.PICKUP_DATE = pickupDate;
			var TrackingIds = bindObj.TrackingIds;
			var trackingIdsLength = TrackingIds.length;
			bindObj.NoOfCartons = qty;
			bindObj.ValidIds = true;

			if (regEx.test(Number(qty)) || Number(qty) === 10) {
				sap.ui.getCore().byId("carton--idCartonQty").setValueState("None");
				if (Number(qty) < trackingIdsLength) {
					for (var id = 0; id < trackingIdsLength - qty; id++) {
						TrackingIds.splice(TrackingIds.length - 1, 1);
					}
				} else if (Number(qty) > trackingIdsLength) {
					for (id = 0; id < qty - trackingIdsLength; id++) {
						TrackingIds.push({
							TrackingId: ""
						});
					}
				}

			} else if (qty > 10) {
				sap.ui.getCore().byId("carton--idCartonQty").setValueState("Error");
				sap.ui.getCore().byId("carton--idSubmit").setEnabled(false);
				for (var id = 0; id < trackingIdsLength - 1; id++) {
					TrackingIds.splice(TrackingIds.length - 1, 1);
				}
			} else {
				sap.ui.getCore().byId("carton--idCartonQty").setValueState("Error");
				sap.ui.getCore().byId("carton--idSubmit").setEnabled(false);
			}

		},

		onCarrierChange: function (oEvent) {
			var pickupDate = this.byId("idPickupDate");
			var completeBtn = this.byId("idCompleteBtn");
			var oOtherCarrierIP = this.byId("idCarrierOtherIP");
			var oParameters = oEvent.getParameters();
			var oOtherCarr = oParameters.selectedItem.getKey();
			if (oOtherCarr === "OT") {
				oOtherCarrierIP.setEnabled(true);
			} else {
				oOtherCarrierIP.setValue("");
				oOtherCarrierIP.setEnabled(false);
			}
			if (!completeBtn.getVisible() && pickupDate.getValueState() !== "Error") {
				/*updateShipmentBtn.setEnabled(true);
				printBOLBtn.setEnabled(false);*/

				pickupDate.fireChange();
			} else {
				this.enableCompleteButton();
			}
		},

		onPickupDateChange: function (oEvent) {

			var updateShipmentBtn = this.getView().byId("idUpdateShipmentBtn");
			var completeBtn = this.getView().byId("idCompleteBtn");
			var printBOLBtn = this.getView().byId("idPrintBOLBtn");
			var confirmBtn = this.getView().byId("idConfirmBtn");
			var carrier = this.getView().byId("idCarrierSelect");
			var newPickupDate = this.getView().byId("idPickupDate").getDateValue();
			var NewPickupDate = this.Date2NumFormat.format(newPickupDate);
			var systemDate = this.getView().getModel("VendorModel").getData().Count.SYSTEM_DATE;
			var value = oEvent.getParameter("value");
			var pickupDateFld = oEvent.getSource();
			var bindObj = pickupDateFld.getBindingContext("VendorModel").getObject();
			var oldPickupDate = bindObj.PICKUP_DATE;
			pickupDateFld.getBindingContext("VendorModel").getObject().NEW_PICKUP_DATE = value;
			bindObj.OLD_PICKUP_DATE = oldPickupDate;

			var aDate = systemDate.slice(4, 6) + "/" + systemDate.slice(6, 8) + "/" + systemDate.slice(0, 4);
			var bDate = NewPickupDate.slice(4, 6) + "/" + NewPickupDate.slice(6, 8) + "/" + NewPickupDate.slice(0, 4);
			var cDate = oldPickupDate.slice(4, 6) + "/" + oldPickupDate.slice(6, 8) + "/" + oldPickupDate.slice(0, 4);
			var todayAsInt = new Date(aDate);
			var formattedNewPickupDate = new Date(bDate);
			var orgPickupDate = new Date(cDate);

			if (oldPickupDate === "00000000") {
				if (formattedNewPickupDate >= todayAsInt) {
					oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
					var viewData = this.getView().getBindingContext("VendorModel").getObject();
					var scanLabels = viewData.scanLabels;
					var pendingScan = viewData.pendingScan;
					this.enableCompleteButton(scanLabels, pendingScan);
				} else {
					oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
					completeBtn.setEnabled(false);
				}
			} else {
				if (formattedNewPickupDate >= todayAsInt) {
					if (formattedNewPickupDate !== orgPickupDate || carrier.getSelectedKey() !== bindObj.CARRIER) {
						oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
						updateShipmentBtn.setEnabled(true);
						printBOLBtn.setEnabled(false);
						confirmBtn.setEnabled(false);
					} else if (formattedNewPickupDate === orgPickupDate) {
						oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
						updateShipmentBtn.setEnabled(false);
						printBOLBtn.setEnabled(true);
						confirmBtn.setEnabled(true);
					}
				} else {
					oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
					updateShipmentBtn.setEnabled(false);
					printBOLBtn.setEnabled(false);
					confirmBtn.setEnabled(false);
				}
			}
		},

		onUpdateShipment: function () {
			var shipmentDueDateText = this.getView().byId('idPickupDate');
			if (shipmentDueDateText.getDateValue() !== null) {
				shipmentDueDateText.setValueState("None");
				if (!this._oDialog) {
					this._oDialog = sap.ui.xmlfragment("carton", "com.hd.rtvworklist.view.CartonDetails", this);
					this.getView().addDependent(this._oDialog);
					this._oDialog.addEventDelegate({
						onAfterRendering: this.setupTabHandling
					}, this);
				}
				var bindObj = this.getView().getBindingContext("VendorModel").getObject();
				var vendorModel = this.getView().getModel("VendorModel");
				bindObj.task = "Update";
				var pickupDate = this.getView().byId("idPickupDate").getValue();
				bindObj.NEW_PICKUP_DATE = pickupDate;
				// bindObj.OLD_PICKUP_DATE = this.DateFormat.format(new Date(bindObj.PICKUP_DATE.getTime() + new Date().getTimezoneOffset() * 60000));
				// bindObj.OLD_PICKUP_DATE = bindObj.PICKUP_DATE;
				bindObj.OLD_PICKUP_DATE = this.formateOldPickupDate(bindObj.PICKUP_DATE);

				bindObj.PICKUP_DATE = bindObj.NEW_PICKUP_DATE;
				var oldTrackingDetails = {
					NoOfCartons: bindObj.NoOfCartons,
					ValidIds: bindObj.ValidIds,
					TrackingIds: []
				};
				bindObj.TrackingIds.forEach(function (element, idx, array) {
					oldTrackingDetails.TrackingIds.push(jQuery.extend(true, {}, element));

				});
				bindObj.oldTrackingDetails = oldTrackingDetails;
				// vendorModel.updateBindings(true);
				this._oDialog.open();
			} else {
				shipmentDueDateText.setValueState("Error");
			}
		},
		formateOldPickupDate: function (value) {
			if (!value) {
				return this.getResourceBundle().getText("PENDING");
			} else {
				if ($.isFunction(value.getTime)) {
					return this.DateFormat.format(new Date(value.getTime() + new Date().getTimezoneOffset() * 60000));
				} else {
					if (value === "00000000") {
						return this.getResourceBundle().getText("PENDING");
					} else if (value !== "00000000") {
						var oLength = value.length;
						var oDate;
						if (oLength === 10) {
							oDate = value.slice(5, 7) + "/" + value.slice(8, 10) + "/" + value.slice(0, 4);
						} else {
							oDate = value.slice(4, 6) + "/" + value.slice(6, 8) + "/" + value.slice(0, 4);
						}
						return oDate;
					} else {
						return value;
					}
				}
			}

		},
		decimalPlaces: function (num) {
			var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
			if (!match) {
				return 0;
			}
			return Math.max(
				0,
				// Number of digits right of decimal point.
				(match[1] ? match[1].length : 0)
				// Adjust for scientific notation.
				- (match[2] ? +match[2] : 0));
		},

		onWeightLiveChange: function (oEvent) {
			var updateShipmentBtn = this.getView().byId("idUpdateShipmentBtn");
			var printBOLBtn = this.getView().byId("idPrintBOLBtn");
			var confirmBtn = this.getView().byId("idConfirmBtn");
			var weightFld = oEvent.getSource();
			var weightValue = weightFld.getValue();
			var weight = weightValue.replace(/[^\d.]/g, "");
			var bundle = this.getView().getModel("WorkListi18n").getResourceBundle();
			var floatQtyValue = parseFloat(weight, 10);
			var oDecimal = this.decimalPlaces(weight);
			if (weight !== "") {
				if (!((floatQtyValue > -1) && (floatQtyValue <= 9999.999))) {
					weightFld.setValueState("Error");
					weightFld.setValueStateText(bundle.getText("MaximumMsg"));
					if (parseInt(weight, 10).toString().length > 4) {
						weightFld.setValue(weight.slice(0, -1));
						updateShipmentBtn.setEnabled(false);
						printBOLBtn.setEnabled(false);
						confirmBtn.setEnabled(false);
					}
					return;
				} else if (oDecimal > 3) {
					var oLength = weight.length;
					oDecimal = oLength + 1;
					oLength = -1 * oLength;
					weightFld.setValueState("Error");
					weightFld.setValueStateText(bundle.getText("MaximumDecMsg"));
					weightFld.setValue(weight.slice(oLength, -1));
					updateShipmentBtn.setEnabled(false);
					printBOLBtn.setEnabled(false);
					confirmBtn.setEnabled(false);

					return;
				} else {
					weightFld.setValueState("None");
					updateShipmentBtn.setEnabled(true);
					printBOLBtn.setEnabled(false);
					confirmBtn.setEnabled(false);
				}

				weightFld.updateDomValue(weight);
			}

		},

		onWeightChange: function (oEvent) {
			var updateShipmentBtn = this.getView().byId("idUpdateShipmentBtn");
			var printBOLBtn = this.getView().byId("idPrintBOLBtn");
			var confirmBtn = this.getView().byId("idConfirmBtn");
			var weightInput = oEvent.getSource(),
				oWeight = weightInput.getValue();
			var dataObj = weightInput.getBindingContext("VendorModel").getObject();
			var viewData = this.getView().getBindingContext("VendorModel").getObject();
			if (viewData.STATUS === "400") {
				dataObj.WEIGHT = weightInput.getValue();
			}
			var scanLabels = viewData.scanLabels;
			var pendingScan = viewData.pendingScan;
			if (viewData.STATUS === "400") {
				if ((/^[0-9]*$/).test(weightInput.getValue()) === false && ((/^[0-9a-zA-Z]*$/).test(weightInput.getValue()) === true || (
						/^[a-zA-Z0-9]*$/).test(weightInput.getValue()) === true || (/^[a-z0-9A-Z]*$/).test(weightInput.getValue()) === true || (
						/^[a-zA-Z]*$/).test(weightInput.getValue()) === true)) {
					weightInput.setValueState("Error");
				} else {
					weightInput.setValueState("None");
					this.enableCompleteButton(scanLabels, pendingScan);
				}
			} else {

				if (dataObj.WEIGHT !== oWeight) {
					if ((oWeight === "") || (Number(oWeight) === 0)) {
						updateShipmentBtn.setEnabled(false);
						printBOLBtn.setEnabled(false);
						confirmBtn.setEnabled(false);
					} else {
						updateShipmentBtn.setEnabled(true);
						printBOLBtn.setEnabled(false);
						confirmBtn.setEnabled(false);
					}
				}
				dataObj.WEIGHT = weightInput.getValue();
			}

		},

		onMessageDialog: function (type, message, oController) {
			var that = oController;
			if (type === "info") {
				sap.m.MessageBox.information(
					message, {
						actions: [MessageBox.Action.OK],
						onClose: function () {
							// that.byId("idShipmentDetailsSearchFld").focus();
							that.onVKeypadHide();
						}
					}
				);
			} else if (type === "error") {
				sap.m.MessageBox.error(
					message, {
						actions: [MessageBox.Action.OK],
						onClose: function () {
							// that.byId("idShipmentDetailsSearchFld").focus();
							that.onVKeypadHide();
						}
					}
				);
			}
		},
		onRTVDetail: function (oEvent) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				jQuery.sap.require("jquery.sap.storage");
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.session);
				oStorage.put("rtvNavBack", window.location.href);
				this.RTVLabel = oEvent.getSource().getText();
				var pickupDate = this.getView().byId("idPickupDate");
				var updateShipmentBtn = this.getView().byId("idUpdateShipmentBtn");
				var completeBtn = this.getView().byId("idCompleteBtn");
				var scanLabelList = this.getView().getBindingContext("VendorModel").getObject().scanLabels;
				if ((updateShipmentBtn.getVisible() && updateShipmentBtn.getEnabled()) || ((scanLabelList.length > 0 || pickupDate.getDateValue() !==
						null) && completeBtn.getVisible())) {

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
								window.rtvNavBack = window.location;
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
					window.rtvNavBack = window.location;
					var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
					var action = "display&/object/" + this.siteId + "/" + this.RTVLabel + "";
					oCrossAppNavigator.toExternal({
						target: {
							semanticObject: "YSO_VIEWRTV",
							action: action
						}
					});
				}
			} else {
				//alert("App to app navigation is not supported in this mode");
			}
		},

		onArticleDetail: function (oEvent) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				this.article = oEvent.getSource().getText();
				var pickupDate = this.getView().byId("idPickupDate");
				var updateShipmentBtn = this.getView().byId("idUpdateShipmentBtn");
				var completeBtn = this.getView().byId("idCompleteBtn");
				var scanLabelList = this.getView().getBindingContext("VendorModel").getObject().scanLabels;
				if ((updateShipmentBtn.getVisible() && updateShipmentBtn.getEnabled()) || ((scanLabelList.length > 0 || pickupDate.getDateValue() !==
						null) && completeBtn.getVisible())) {
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
					var action = "Y_LOOKUP&/product/" + this.siteId + "/00000000" + this.article + "";
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

		_AuthorizationVerifyAccess: function () {
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				oData = oAuthModel.getData(),
				completeBtn = this.getView().byId("idCompleteBtn");
			if (oData.results) {
				completeBtn.setVisible(
					oData.results.some(function (item) {
						return (item.Vendor === "Y");
					})
				);
			} else {
				this._AuthorizationAccess();
			}

		},

		_AuthorizationAccess: function () {
			var oModel = this.getModel();
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
				completeBtn = this.getView().byId("idCompleteBtn");
			var that = this;
			sap.ui.core.BusyIndicator.show();
			oModel.read("/UserAuthSet", {
				success: function (oData, response) {
					oAuthModel.setData(oData);
					sap.ui.core.BusyIndicator.hide();
					completeBtn.setVisible(
						oData.results.some(function (item) {
							return (item.Vendor === "Y");
						})
					);
				},
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		onNavBack: function () {
			var oHistory, sPreviousHash;
			var pickupDate = this.getView().byId("idPickupDate");
			var updateShipmentBtn = this.getView().byId("idUpdateShipmentBtn");
			var completeBtn = this.getView().byId("idCompleteBtn");
			var printBOLBtn = this.getView().byId("idPrintBOLBtn");
			var confirmBtn = this.getView().byId("idConfirmBtn");
			var scanLabelList = this.getView().getBindingContext("VendorModel").getObject().scanLabels;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			var that = this;

			if ((updateShipmentBtn.getVisible() && updateShipmentBtn.getEnabled()) || ((scanLabelList.length > 0 || pickupDate.getDateValue() !==
					null) && completeBtn.getVisible())) {
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
								dialog.close();
								that.getRouter().navTo("worklist_tab", {
									selectedKey: "vendor"
								}, true);
								pickupDate.getBindingContext("VendorModel").getObject().PICKUP_DATE = "";
								completeBtn.setVisible(false);
								printBOLBtn.setVisible(false);
								confirmBtn.setVisible(false);
								updateShipmentBtn.setVisible(false);
								updateShipmentBtn.setEnabled(false);
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
			} else {
				pickupDate.setValueState("None");
				that.getRouter().navTo("worklist_tab", {
					selectedKey: "vendor"
				}, true);
				var oAuthModel = this.getOwnerComponent().getModel("oAuthModel"),
					oData = oAuthModel.getData();
				completeBtn.setVisible(
					oData.results.some(function (item) {
						return (item.Vendor === "Y");
					})
				);
				updateShipmentBtn.setVisible(false);
				printBOLBtn.setVisible(false);
				confirmBtn.setVisible(false);
			}
		}

	});
});
