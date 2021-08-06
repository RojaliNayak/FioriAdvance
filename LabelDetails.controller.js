/*global location */
sap.ui.define([
	"com/hd/rtvview/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"com/hd/rtvview/model/formatter"
], function(BaseController, JSONModel, MessageToast, formatter) {
	"use strict";

	return BaseController.extend("com.hd.rtvview.controller.LabelDetails", {

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
			this.getRouter().getRoute("objectlabel").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
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
			}.bind(this));
			this.getOwnerComponent().googleAnalyticUpdate({page:"Label Details",site: sWERKS});//Google Analytics
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

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		onArticleNumPress: function(oEvent) {

			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				jQuery.sap.require("sap.m.MessageBox");
				//var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				var article = oEvent.getSource().getIntro();

				window.rtv_back_navigation = "X";
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				var storid = this.getOwnerComponent().site;
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
	});

});