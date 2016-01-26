;(function($){
	/*页面渲染容器*/
	var $container = null;
	/*系统配置项默认值*/	
	var $defaults = {
		/*容器值选择器*/
		container:'#container',
		/*默认路由*/
		defaultRoute:'index.html',
		/*默认参数*/
		defaultParams:'redirect_url',
		/*调试模式开关*/
		debug:false,
		/*界面没有找到时需要加载的界面*/
		notFound:'',
		/*每次界面加载前执行的函数*/
		beforeLoad:function(){
			
		}
	};
	/**
	 * 缓存工厂实现
	 * {function} setItem 设置缓存
	 * {function} delItem 清除缓存
	 * {function} getItem 获得缓存
	 */
	var $cacheFactory =(function(){
		/*缓存容器*/
		var cachePool = {};
		/*发布方法*/
		return {
			/**
			 * 设置缓存
			 * {string} key 缓存的key,应保证key的长度足够端，保证查询速度
			 * {~} value 需要进行替换的数据
			 * return undefined 无返回值
			 */
			setItem:function(key,value){
				cachePool[key] = value;
			},
			/**
			 * 根据key获取缓存
			 * {string} key 缓存的key
			 * return {~} 原样返回设置的值
			 */
			getItem:function(key){
				return cachePool[key];
			},
			/**
			 * 根据key删除缓存
			 * {string} key 缓存的key
			 * return {boolean} 是否删除成功
			 */
			delItem:function(key){
				delete cachePool[key];
				return key in cachePool;
			},
			/**
			 * 判断key是否在缓存中
			 * {string} key 缓存的key
			 * return {boolean} 是否存在缓存
			 */
			hasItem:function(key){
				return cachePool.hasOwnProperty(key);
			}
		};
	})();
	/**
	 * 页面工厂实现
	 * {function} addPage 添加页面
	 * {function} delPage 删除页面
	 * {function} getPage 获得页面
	 */
	var $pageFactory = (function(){
		/*页面存放的公共容器*/
		var pages = {};
		/**
		 * 向容器中添加一个页面，添加的页面立刻生效
		 * 添加的页面的结构如下：
		 * {
		 *   route:'',//路由参数，填写入element中的data-href
		 *   templateUrl:'',//页面模板所在的路径
		 *   page:function(page,args){}//页面加载完毕后执行的方法：page 当前页面的jQuery对象,args:参数
		 * }
		 */
		return {
			/**
			 * 添加一个界面
			 * {object} page 添加一个界面
			 */
			addPage:function(page){
				pages[page['route']] = page;
			},
			/**
			 * 删除一个界面
			 * {string} route 页面的路由参数
			 */
			delPage:function(route){
				delete pages[route];
				return route in pages;
			},
			/**
			 * 根据key获取一个界面
			 */
			getPage:function getPage(route){
				return pages[route];
			}
		};
	})();
	/**
	 * 路由控制器
	 * 该函数响应html元素中含有[data-href]的属性的点击事件
	 * 解析路由参数：html元素中含有[data-args]的属性
	 * 向历史记录中添加一条历史记录
	 */
	var $route = function(){
		/*html元素中的路由参数*/
		var route = this['dataset']['href'];
		/*参数容器*/
		var args = {};
		/*历史记录基本格式，主要用于刷新时候，页面报错的情况*/
		var path_info = 'index.php?'+$defaults.defaultParams+'='+route;
		/*解析参数*/	
		this['dataset']['args']&&this['dataset']['args'].split(',').forEach(function(item,index){
			var _p = item.split('=');
			args[_p[0]] = _p[1];
			path_info += '/'+_p[0]+'/'+_p[1];
		});
		/*生成state参数*/
		var state = {
			route:route,
			params:args
		};
		/*添加历史记录*/
		history.pushState(state,'',path_info);
		/*分发请求*/
		$dispatcher();
	};
	/**
	 * 分发响应器
	 * 改方法主要负责解析history中的state参数
	 * 从缓存中或者网络中加载html模板
	 * 并执行page方法
	 */
	var $dispatcher = function(){
		/*得到路由参数*/
		var route = (history.state && history.state.route ? history.state.route : $defaults.defaultRoute.split('/').shift()).replace(/\//g,'');
		/*获得当前界面的page对象*/
		var page = $pageFactory.getPage(route);
		/*界面渲染和page方法的执行*/
		var callback = function(template){
			$container.html(template);
			$defaults.beforeLoad();
			page.page(page,history.state && history.state.params ? history.state.params:[]);
		};
		/*从网络或者缓存中加载html代码*/
		if($cacheFactory.hasItem(route)){
			callback($cacheFactory.getItem(route));
		}else{
			$.get(page.templateUrl,function(template){
				$cacheFactory.setItem(route,template);
				callback(template);
			});
		}
	};
	/**
	 * 系统框架初始化方法
	 * 解析默认路由
	 * 绑定popstate事件
	 * 绑定click事件
	 * 手动触发分发事件
	 */
	var init = function(){
		
		var path_info = $defaults.defaultRoute.split('/');
		var args_info = path_info.slice(1); 
		var args = {};
		
		for(var i=0;i<args_info.length;i+=2){
			args[path_info[i]] = path_info[i+1]
		}
		
		args_info.length == 0 && history.pushState({route: path_info[0],params:args},'','index.php?'+$defaults.defaultParams+'='+$defaults.defaultRoute);
		
		$(window).bind('popstate',$dispatcher);
		$(this).on('click','*[data-href]',$route);
		$dispatcher();
		
	};
	//发布方法
	$.fn.extend({
		spa:function(config){
			$container = $(this);
			!!config && ($defaults = $.extend($defaults,config));
			init.call(this);
		}
	});
	//发布方法
	$.extend({
		page:$pageFactory.addPage
	});
	
})(jQuery);
	
	