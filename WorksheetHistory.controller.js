/*global location */
sap.ui.define([
	"sap/ui/Device",
	"com/hd/rtvview/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"com/hd/rtvview/model/formatter",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/m/Text",
	"sap/m/HBox",
	"sap/ui/model/Sorter"
], function(Device, BaseController, JSONModel, formatter, MessageToast, Filter, Text, HBox, Sorter) {
	"use strict";

	return BaseController.extend("com.hd.rtvview.controller.WorksheetHistory", {

		formatter: formatter,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.hd.rtvview.view.LabelDetails
		 */
		onInit: function() {
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});
			this.getRouter().getRoute("worksheetHistory1").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
			
			//--
			var worksheetHistoryModel = new JSONModel();
			worksheetHistoryModel.setSizeLimit(1000);
			this.getView().setModel(worksheetHistoryModel, "worksheetHistoryModel");
		},

		_onObjectMatched: function(oEvent) {
			var sWERKS = oEvent.getParameter("arguments").WERKS;
			var sLABEL_NUM = oEvent.getParameter("arguments").LABEL_NUM;
			this.getModel("screen").setProperty("/detailPath", {
				WERKS: sWERKS,
				LABEL_NUM: sLABEL_NUM
			});
			this.getOwnerComponent().site = sWERKS;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("LabelSet", {
					WERKS: sWERKS,
					LABEL_NUM: sLABEL_NUM
				});
				this._bindView("/" + sObjectPath);
				this.getView().getModel("worksheetHistoryModel").setData(null);
			    this.getView().getModel("worksheetHistoryModel").checkUpdate(true);
				this._bindWorksheetHistoryTable(sWERKS, sLABEL_NUM);
			}.bind(this));
			this.getOwnerComponent().googleAnalyticUpdate({page:"Worksheet History",site: sWERKS});//Google Analytics
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		
		_bindWorksheetHistoryTable: function(werks,labelNo){
			var oModel = this.getView().getModel();
			var sPath = "/EmailSet";
			var aFilters = [
					new Filter("WERKS", "EQ", this.getOwnerComponent().site),
					new Filter("LABEL_NUM", "EQ", labelNo)
				];
			var that = this;
			var worksheetHistoryModel = this.getView().getModel("worksheetHistoryModel");
			oModel.read(sPath, {filters: aFilters, success: function(oData){
				worksheetHistoryModel.setData(oData);
				worksheetHistoryModel.checkUpdate(true);
			}, error:function(oError){
				that.serviceError(oError);         
			}});
		},
	

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.MATNR,
				sObjectName = oObject.Maktx,
				oViewModel = this.getModel("detailView");
		},
		
		onArticleNumPress: function(oEvent) {

			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				jQuery.sap.require("sap.m.MessageBox");
				var article = oEvent.getSource().getIntro();

				window.rtv_back_navigation = "X";
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				var storid =  this.getOwnerComponent().site;
				var action = "Y_LOOKUP&/product/" + storid + "/00000000" + article + "";
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: "Article",
						action: action
					}
				});
			} else {
				MessageToast.show(this.getResourceBundle().getText("AppToAppNavNotPossible"));
			}

		},

		onNavBack: function() {

			this.getRouter().navTo("object",
				this.getModel("screen").getProperty("/detailPath"),
				true);
		}

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.hd.rtvview.view.LabelDetails
		 */
		// onBeforeRendering: function() {/*

		// 	var oModel = this.getModel("screen");
		// 	var size = oModel.getProperty("/size");
		// 	var isMasterClose = oModel.getProperty("/isMasterClose");

		// 	if ((size < 600) || (size < 1000 && isMasterClose === false)) {
		// 		this.byId("historyTab1").setVisible(true);
		// 		this.byId("historyTab2").setVisible(false);
		// 	} else {
		// 		this.byId("historyTab1").setVisible(false);
		// 		this.byId("historyTab2").setVisible(true);
		// 	}

		// */},

		// onAfterRendering: function() {

		// 	// sap.ui.core.ResizeHandler.register(this.getView(), this._onResize);

		// },

		// _onResize: function(oEvent) {
		// 	if ((oEvent.size.width < 400)) {
		// 		oEvent.control.byId("historyTab1").setVisible(true);
		// 		oEvent.control.byId("historyTab2").setVisible(false);
		// 	} else {
		// 		oEvent.control.byId("historyTab1").setVisible(false);
		// 		oEvent.control.byId("historyTab2").setVisible(true);
		// 	}
		// }

	});

});