sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text"
], function (Controller, History, Filter, FilterOperator, Dialog, Button, Text) {
	"use strict";

	return Controller.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.Menu", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf YRTV_ONE_TILE.YRTV_ONE_TILE.view.Menu
		 */
		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("Menu").attachPatternMatched(this.onPatternMatched, this);
		},

		onPatternMatched: function () {
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel");
			var oSelect = this.getView().byId("idMenu");
			var oBinding = oSelect.getBinding("items");
			var aFilters = [];
			var sRole = '';
			if (oAuthModel.getData().Met === 'Y') {
				sRole = 'MET';
			} else if (oAuthModel.getData().PSC_User === 'Y') {
				sRole = 'PSC';
			}
			aFilters.push(new Filter("Store", sap.ui.model.FilterOperator.EQ, oAuthModel.getData().Store));
			aFilters.push(new Filter("Role", sap.ui.model.FilterOperator.EQ, sRole));
			oBinding.filter(aFilters);
		},

		onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("home", true);
			}
		},

		getBundleText: function (sKey, sCount, aPlaceholderValues) {
			var sText = this.getView().getModel("i18n").getResourceBundle().getText(sKey);
			if (sCount !== '') {
				return sText + " " + "(" + sCount + ")";
			} else return sText;
		},

		itemSelection: function (oEvent) {
			var sSelectedKey = oEvent.getParameters().item.getKey();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel");
			switch (sSelectedKey) {

			case 'Home':
				this.getOwnerComponent().getRouter().navTo("home");
				break;

			case 'BackToSearch':
				// this.getRouter().navTo("home");
				break;

			case 'VerifyItems':
				this.getOwnerComponent().getRouter().navTo("VerifyItems");
				break;

			case 'Shipment':
				if (oAuthModel.getData().PSC_User === 'Y' && oAuthModel.getData().Store === "") {
					var dialog = new Dialog({
						title: this.getResourceBundle().getText("Error"),
						type: "Message",
						state: "Error",
						content: new Text({
							text: this.getResourceBundle().getText("NoStorePSC")
						}),
						endButton: new Button({
							text: this.getResourceBundle().getText("OK"),
							press: function () {
								dialog.close();
							}
						}),
						afterClose: function () {
							dialog.destroy();
						}
					});
					dialog.open();
					return;
				} else {
					//Hardcode style class to compact
					$.sap.appView.removeStyleClass(this.getOwnerComponent().getContentDensityClass());
					
					$.sap.appView.addStyleClass("sapUiSizeCompact");
					
					var oldLink = document.getElementsByTagName("link")["baseCSS"];

					var newLink = document.createElement("link");
					newLink.setAttribute("rel", "stylesheet");
					newLink.setAttribute("type", "text/css");
					newLink.setAttribute("id", "baseCSS");
					newLink.setAttribute("href", oldLink.href.split("css")[0] + "css/Worklist/style.css");

					//Save old link for navigating back to home
					$.sap.rootCSS = oldLink;
					this.getOwnerComponent().Worklist();
					document.getElementsByTagName("head")[0].replaceChild(newLink, oldLink);
					oRouter.navTo("VendorWorklist", {});
				}
				break;

			case 'Destroy':
				// this.getRouter().navTo("home");
				var oldLink = document.getElementsByTagName("link")["baseCSS"];

				var newLink = document.createElement("link");
				newLink.setAttribute("rel", "stylesheet");
				newLink.setAttribute("type", "text/css");
				newLink.setAttribute("id", "baseCSS");
				newLink.setAttribute("href", oldLink.href.split("css")[0] + "css/Worklist/style.css");

				//Save old link for navigating back to home
				$.sap.rootCSS = oldLink;
				this.getOwnerComponent().Worklist();
				document.getElementsByTagName("head")[0].replaceChild(newLink, oldLink);
				oRouter.navTo("VendorWorklist", {});
				break;

			case 'Buyback':
				this.getOwnerComponent().getRouter().navTo("Buyback");
				break;

			case 'Awaiting':
				// this.getRouter().navTo("home");
				var oldLink = document.getElementsByTagName("link")["baseCSS"];

				var newLink = document.createElement("link");
				newLink.setAttribute("rel", "stylesheet");
				newLink.setAttribute("type", "text/css");
				newLink.setAttribute("id", "baseCSS");
				newLink.setAttribute("href", oldLink.href.split("css")[0] + "css/Worklist/style.css");

				//Save old link for navigating back to home
				$.sap.rootCSS = oldLink;
				this.getOwnerComponent().Worklist();
				document.getElementsByTagName("head")[0].replaceChild(newLink, oldLink);
				oRouter.navTo("VendorWorklist", {});
				break;

			case "METWorklist":
				// this.getRouter().navTo("home");
				// break;
				//Run component if it hasn't been run before
				var oldLink = document.getElementsByTagName("link")["baseCSS"];

				var newLink = document.createElement("link");
				newLink.setAttribute("rel", "stylesheet");
				newLink.setAttribute("type", "text/css");
				newLink.setAttribute("id", "baseCSS");
				newLink.setAttribute("href", oldLink.href.split("css")[0] + "css/METWorklist/style.css");

				//Save old link for navigating back to home
				$.sap.rootCSS = oldLink;
				this.getOwnerComponent().metWorklist();
				document.getElementsByTagName("head")[0].replaceChild(newLink, oldLink);
				oRouter.navTo("METWorklist", {});
				break;

			case "CageAudit":
				this.getOwnerComponent().cageAuditComp();
				this.getOwnerComponent().getRouter().navTo("CageAudit");
				break;

			case 'CageReport':
				this.getOwnerComponent().getRouter().navTo("CageReport");
				break;
			}
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf YRTV_ONE_TILE.YRTV_ONE_TILE.view.Menu
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf YRTV_ONE_TILE.YRTV_ONE_TILE.view.Menu
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf YRTV_ONE_TILE.YRTV_ONE_TILE.view.Menu
		 */
		//	onExit: function() {
		//
		//	}

	});

});