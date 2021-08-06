sap.ui.define([
	"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/CreateVerify/BaseController",
	"YRTV_ONE_TILE/YRTV_ONE_TILE/model/Createverify/formatter"
], function(BaseController, formatter) {
	"use strict";

	return BaseController.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.CreateVerify.ArticleDetail", {
        formatter: formatter,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.hd.rtvcreate.view.view.ArticleDetail
		 */
			onInit: function() {
				this.getRouter().getRoute("articleAdditionalDetail").attachPatternMatched(this._onArticleDetailMatched, this);
			},
			
			_onArticleDetailMatched: function(oEvent){
				this.sArticle =  oEvent.getParameter("arguments").article;
				this.sVendor = oEvent.getParameter("arguments").vendor;
				this.sReasonCd = oEvent.getParameter("arguments").reasonCd;
				var oParameters = oEvent.getParameters();
				if(oParameters.name === "articleAdditionalDetail"){
				
				}
			},
			
			onNavBack : function() {
				// debugger;
			}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.hd.rtvcreate.view.view.ArticleDetail
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.hd.rtvcreate.view.view.ArticleDetail
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.hd.rtvcreate.view.view.ArticleDetail
		 */
		//	onExit: function() {
		//
		//	}

	});

});