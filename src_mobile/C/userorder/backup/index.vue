<template>
    <div class="bodyContainer">
        <div id="fixTabHead" class="fixTabHead">
            <span @click="onTabItemClick('unuse')" data-type="unuse" class="tabItem unuse" :class="{active:tabActive=='unuse'}">未使用</span>
            <span @click="onTabItemClick('history')" data-type="history" class="tabItem history" :class="{active:tabActive=='history'}">历史订单</span>
        </div>
        <div id="scrollWrap" class="scrollWrap">
            <scroller
                v-ref:scroller
                :height="scrollerHeight"
                :lock-x="true"
                :use-pulldown="true"
                :use-pullup="true"
                :lock-y="lockY"
                :pullup-config="pullupConfig"
                :pulldown-config="pulldownConfig"
                v-on:pullup:loading="onPullupLoading"
                v-on:pulldown:loading="onPulldownLoading"
                :scrollbar-x="false">
                <div class="scrollCon">
                    <ul v-if="tabActive=='unuse'" data-type="unuse" class="scrollInerCon unuse">
                        <li class="item" v-link="{name:'detail',params:{id:$index}}" v-for="item in unuse.list" v-text="$index"></li>
                    </ul>
                    <ul v-if="tabActive=='history'" data-type="history" class="scrollInerCon history">
                        <li class="item" v-link="{name:'detail',params:{id:$index}}" v-for="item in history.list" v-text="$index"></li>
                    </ul>
                </div>
            </scroller>
        </div>
    </div>
</template>
<script type="es6">
    const OrderService = require("SERVICE_M/mall-member-user-order");
    let Alert = PFT.Mobile.Alert;
    let Toast = new PFT.Mobile.Toast();
    let __TransformPre = (function(){
        var div = document.createElement("div");
        var transform = {
            transform : "transform",
            webkitTransform : "webkitTransform"
        };
        for(var i in transform){
            if(div.style[i]!=="undefined") return transform[i];
        }
    })();
    export default{
        data(){
            return{
                lockY : false,
                scrollerHeight : "",
                tabActive : "unuse",
                unuse : {
                    page : 0,
                    totalPage : 0,
                    list : []
                },
                history : {
                    page : 0,
                    totalPage : 0,
                    list : []
                },
                pullupConfig : {
                    content: '查看更多订单..',
                    pullUpHeight: 60,
                    height: 40,
                    autoRefresh: false,
                    downContent: '释放以加载更多..',
                    upContent: '查看更多订单..',
                    loadingContent: '努力加载中..',
                    clsPrefix: 'xs-plugin-pullup-'
                },
                pulldownConfig : {
                    content: '刷新..',
                    pullUpHeight: 60,
                    height: 40,
                    autoRefresh: false,
                    downContent: '释放以刷新订单..',
                    upContent: '刷新订单..',
                    loadingContent: '努力加载中..',
                    clsPrefix: 'xs-plugin-pulldown-'
                }
            }
        },
        ready(){
            var win = PFT.Util.winWidthHeight();
            var fixTabHeight = $("#fixTabHead").height();
            this.scrollWrap = $("#scrollWrap");
            this.scrollerHeight = String(win.height-fixTabHeight)+"px";
        },
        route : {
            data(transition){
                this.lockY = false;
                var type = this.tabActive = sessionStorage.getItem("tabActive") || this.tabActive;
                if(transition.from.name=="detail"){ //从detail重新回到index页则直接取sessionStorage里的data list
                    var data = JSON.parse(sessionStorage.getItem(type));
                    this.$set(type+".page",data.page);
                    this.$set(type+".totalPage",data.totalPage);
                    this.$set(type+".list",data.list);
                    this.$nextTick(()=>{
                        if((this[type]["page"]>=this[type]["totalPage"]) || this[type]["totalPage"]==-1){
                            this.disableScroll();
                        }
                        var translateY = sessionStorage.getItem("translateY") || 0;
                        this.setTranslateY(translateY);
                    })

                }else{//如果是从外部页面进入到index页
                    this.fetchData(this.tabActive);
                }
            },
            activate(){

            },
            deactivate(){
                this.lockY = true;
                sessionStorage.setItem("tabActive",this.tabActive);
                sessionStorage.setItem("unuse",JSON.stringify(this.unuse));
                sessionStorage.setItem("history",JSON.stringify(this.history));
                //记录垂直滚动Y轴的距离
                sessionStorage.setItem("translateY",this.getTranslateY());
            }
        },
        watch : {
            scrollable(val){
                if(val==true){
                    this.enableScroll();
                    this.resetScroll();
                }else{
                    this.disableScroll();
                }
            }
        },
        computed : {
            scrollable(){
                var tabActive = this.tabActive;
                var data = this[tabActive];
                var page = data.page;
                var totalPage = data.totalPage;
                if(page<totalPage || page==0){
                    return true; //可以滑动监听上拉加载更多
                }else{
                    return false; //不可上拉加载更多
                }
            }
        },
        methods : {
            fetchData(type,page){
                page = page || 1;
                OrderService.list({
                    type : type || "unuse",
                    page : page,
                    pageSize : 20
                },{
                    loading : () => {
                        Toast.show("loading","努力加载中..");
                    },
                    complete : () => {
                        Toast.hide();
                    },
                    empty : () => {
                        this.$broadcast('pullup:disable', this.$refs.scroller.uuid)
                    },
                    success : (data) => {
                        var totalPage = data.total_page;
                        var list = data.list;
                        var resultList;
                        if(type=="unuse"){
                            this.$set("unuse.page",page);
                            this.$set("unuse.totalPage",totalPage);
                            resultList = page==1 ? list : this.unuse.list.concat(list);
                            this.$set("unuse.list",resultList);
                        }else{
                            this.$set("history.page",page);
                            this.$set("history.totalPage",totalPage);
                            resultList = page==1 ? list : this.history.list.concat(list);
                            this.$set("history.list",resultList);
                        }
                        this.$nextTick(()=>{
                            if(page==1){
                                this.$broadcast('pulldown:reset', this.$refs.scroller.uuid);
                                this.resetScroll();
                            }else{
                                this.$broadcast('pullup:reset', this.$refs.scroller.uuid)
                            }
                        })
                    },
                    fail : (msg) => {
                        Alert("提示",msg);
                    }
                })
            },
            onPullupLoading(uuid){
                var page = this.tabActive=="unuse" ? (this.unuse.page+1) : (this.history.page+1);
                this.fetchData(this.tabActive,page)
            },
            onPulldownLoading(uuid){
                this.fetchData(this.tabActive,1)
            },
            onTabItemClick(type){
                this.tabActive = type;
                sessionStorage.setItem("tabActive",type);
                if(type=="history" && this.history.page==0 && this.history.totalPage==0){
                    this.fetchData(type);
                }
                if(type=="unuse" && this.unuse.page==0 && this.unuse.totalPage==0){
                    this.fetchData(type);
                }
                this.$nextTick(()=>{
                    this.resetScroll();
                })
            },
            getTranslateY(){
                var scroller = document.querySelector("#scrollWrap .xs-container");
                var style = window.getComputedStyle(scroller,null);
                var transform = style["transform"] || style["-webkit-transform"];
                //transform属性值最终都会被转化成矩阵 matrix(a,b,c,d,e,f)
                //详情请参考:http://www.zhangxinxu.com/wordpress/2012/06/css3-transform-matrix-%E7%9F%A9%E9%98%B5/
                var matrix = transform.replace(/(^matrix\()(.*)(\))$/,function($0,$1,$2,$3){ return $2;})
                matrix = matrix.split(",");
                return matrix[matrix.length-1];
            },
            setTranslateY(val){
                var scroller = document.querySelector("#scrollWrap .xs-container");
                //transform: translate(0px, 0px) translateZ(0px)
                scroller.style[__TransformPre] = "translate(0px, "+val+"px) translateZ(0px)";
            },
            disableScroll(){
                this.$broadcast('pullup:disable', this.$refs.scroller.uuid);
            },
            enableScroll(callback){
                this.$broadcast('pullup:enable', this.$refs.scroller.uuid);
                callback && callback();
            },
            resetScroll(callback){
                this.$refs.scroller.reset();
                callback && callback();
            }
        },
        components : {
            scroller : require("vux/src/components/scroller/index.vue")
        }
    }
</script>
<style lang="sass">
    @import "COMMON/css/base/main";
    body{ background:$bgColor}
    $tabHeight : 42px;
    .scrollWrap{ margin-top:$tabHeight}
    #fixTabHead{
        position:fixed;
        top:0;
        left:0;
        right:0;
        z-index:10;
        height:$tabHeight;
        line-height:$tabHeight;
        overflow:hidden;
        background:#e5f5fc;
        box-shadow:0 1px 1px rgba(0,0,0,0.1);
    }
    #fixTabHead .tabItem{
        position:relative;
        float:left;
        width:50%;
        height:100%;
        line-height:$tabHeight;
        text-align:center;
    }
    #fixTabHead .tabItem.active{
        color:$orange;
    }
    #fixTabHead .tabItem.active:before{
        content : "";
        position:absolute;
        left:20%;
        right:20%;
        bottom:0;
        height:2px;
        background:$orange;
        font-size:0;
    }

    .item{
        height:100px;
        line-height:100px;
        text-align:center;
        background:#fff;
        margin-bottom:10px;
    }









    .xs-plugin-pullup-container{ line-height:40px}



</style>