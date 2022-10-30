const {api, type, Extension}= require('clipcc-extension');

const VM= api.getVmInstance();
const stage_blocks= ()=> VM.runtime.targets[0].blocks._blocks;
const menusCacheName= 'ClipCCExtension.nhjr.custom_menu.menus.block';

var project_data= null;/*null初始化状态，true已加载缓存，object类型为待载入内容的对象*/
const notAllowName= /[\[\]{}"&'%<\'\"\n\r\t\b\f]/g ;/*用于检测积木名称里不合规的字符。*/


var extension_loded= false;
var extension_loded_category= false;
var extension_loded_reporter= false;
var extension_error= '';
var block_delete_menu_finished= true;
var block_delete_menu_lastTime= null;
const menusCacheValueName_default= 'ClipCCExtension.nhjr.custom_menu.menus.value';
var menusCacheValueName= menusCacheValueName_default;
var menus= {};
const resetMenus= ()=>{
    menusCacheValueName= menusCacheValueName_default;
    menus= {};
}

function returnForMenu(MENU){
    if(MENU===undefined || MENU.length <1) return [['','']];
    return MENU
}

const add_returnMenu_block= name =>{
    api.removeBlock('nhjr.custom_menu.returnMenu.'+name);
    api.addBlock({
        opcode: 'nhjr.custom_menu.returnMenu.'+name,
        type: type.BlockType.REPORTER,
        messageId: `menu ${name}[VALUE]`,
        categoryId: 'nhjr.custom_menu.reporter',
        param: {
            VALUE: {
                type: type.ParameterType.STRING,
                menu: ()=> returnForMenu(menus[name]),
                default: returnForMenu(menus[name])[0][1]
            }
        },
        function: a=>a.VALUE
    });
}

const loadProjectCacheValue= sb =>{
    if(sb===undefined) return;
    console.log('loadProjectCacheValue');
    if(sb.hasOwnProperty(menusCacheName)){
        try{
            menusCacheValueName= sb[menusCacheName].inputs.NUM.block;
            menus= JSON.parse( sb[menusCacheValueName].fields.NUM.value );
            if(typeof menus !=='object' || Array.isArray(menus) || String(menus) !=='[object Object]'){
                menus= {};
                console.error('loadProjectCacheValue error: not allowed type!')
            }
            for(const name in menus){
                if( name.search(notAllowName) >=0 ) continue;/*积木名称中检测到不合规字符，跳过*/
                var list= menus[name];
                if(!Array.isArray(list) || list.length <1 ) menus[name]= [['','']];/*不是允许的类型，重置。*/
                else{
                    /*遍历检查*/
                    for(const i in list){
                        var item= list[i];
                        if(!Array.isArray(item) ||
                            item.length !==2 ||
                            typeof item[0] !=='string' ||
                            !['string','number'].includes(typeof item[1])
                        ) list[i]= ['','']/*不是允许的类型，重置。*/
                    }
                }
                add_returnMenu_block(name);
            }
        }catch(e){
            console.error(e);
            menus= {};
        }
    }else resetMenus()
}

const str_menus= ()=> JSON.stringify(menus);

function loadCategory(){
    api.removeCategory('nhjr.custom_menu.category');
    api.addCategory({
        categoryId: 'nhjr.custom_menu.category', 
        messageId: 'nhjr.custom_menu.category',
        color: '#da1b78'
    });
    extension_loded_category= true
}
function loadReporter(){
    api.removeCategory('nhjr.custom_menu.reporter');
    api.addCategory({
        categoryId: 'nhjr.custom_menu.reporter', 
        messageId: 'nhjr.custom_menu.reporter',
        color: '#da1b78'
    });
    extension_loded_reporter= true
}
function removeCategorys(){
    api.removeCategory('nhjr.custom_menu.category');
    extension_loded_category= false;
    api.removeCategory('nhjr.custom_menu.reporter');
    extension_loded_reporter= false;
    extension_loded= false;
}

/*————————————————————————————————————————————————————————————————————*/

module.exports=class E extends Extension{

onUninit() {
    console.log('nhjr.custom_menu onUninit');
    removeCategorys()
}
logError(e) {
    console.error(e);
    extension_error= String(e);
    return extension_error;
}
menus_namesMenu(){
    var export_menu= {};
    for(const i in menus){
        export_menu[i]= i
    }
    return returnForMenu( Object.entries(export_menu) )
}
allowName(value){
    return String(value).replace(notAllowName,' ').trim()
}


beforeProjectLoadExtension(data, extensions){
    try{
        console.log('nhjr.custom_menu beforeProjectLoadExtension');
        if(extension_loded){
            /*二次加载作品时，如果扩展已装载，就不会触发onInit。所以要在这里完成更新*/
            loadReporter();
            loadProjectCacheValue(data[0].blocks._blocks);
            project_data= true
        }else project_data= data
        /*onInit不支持data，所以需要从这里传入*/
    }catch(e){
        console.error(e);
        window.alert('nhjr.custom_menu beforeProjectLoadExtension error\n'+e)
    }
}
onInit() {
    try{
        console.log('nhjr.custom_menu onInit');
        loadCategory();
        loadReporter();
        if(project_data===true){
            /*项目缓存已经被加载，只需要按照menus里的装载即可。*/
            for(const name in menus){
                add_returnMenu_block(name);
            }
        }else if(project_data){
            /*如果此时正在加载项目文件，那么vm还不能用。所以需要data完成加载。*/
            loadProjectCacheValue( project_data[0].blocks._blocks );
            project_data= true
        }else if(project_data===null){
            /*此时变量仍是初始化状态，代表着并不是在项目加载时运行。因此vm可用。*/
            loadProjectCacheValue( stage_blocks() );
            project_data= true
        }else{
            /*目前没遇到过的情况。可能是data指定的对象不存在，也可能是其它程序的干扰。*/
            console.error("Can't load project_data: ");
            console.log(project_data)
        }
        this.onInit_addBlocks();
        extension_loded= true;
    }catch(e){
        console.error(e);
        window.alert('nhjr.custom_menu onInit error\n'+e)
    }
}

onInit_addBlocks(){
    let alerting = false;

    api.addBlock({
        opcode: 'nhjr.custom_menu.readme',
        type: type.BlockType.REPORTER,
        messageId: 'nhjr.custom_menu.readme',
        categoryId: 'nhjr.custom_menu.category',
        function: ()=> `language: zh-cn
该扩展会往项目文件里自动存入菜单信息，因此如果不是动态菜单，只需要一次性生成即可。
该扩展只会往背景的积木区域里存入菜单信息。

若一个菜单正在被使用，请不要删除它！

请不要连点 delete menu 积木，这会使积木栏出现故障。

set menu 可以填入以下形式：
[["one",1],["two","2"],"test",123456]

menu积木名称 不支持以下符号，它们都将被替换为空格：
[]{}"&'%<
还有一些特殊符号也不支持,它们也会被替换为空格：
\\'\\"\\n\\r\\t\\b\\f

扩展源码仓库
https://github.com/NanHaiJuRuo/clipcc-extension-custom_menu`
    });

    api.addBlock({
        opcode: 'nhjr.custom_menu.set_menu',
        type: type.BlockType.COMMAND,
        messageId: 'nhjr.custom_menu.set_menu',
        categoryId: 'nhjr.custom_menu.category',
        param: {
            NAME: {
                type: type.ParameterType.STRING,
                default: 'my_menu'
            },MENU: {
                type: type.ParameterType.STRING,
                default: '[ ["one","1"], ["two","2"], ["three","3"] ]'
            }
        },
        function: a=>{
            try{
                const sb= stage_blocks();
                /*当舞台积木区没有缓存积木时，创建缓存积木*/
                if(!sb.hasOwnProperty(menusCacheName)){
                    sb[menusCacheValueName_default] ={
                        fields: {
                            NUM: {
                                id: undefined,
                                name: "NUM",
                                value: str_menus()
                            }
                        },
                        id: menusCacheValueName_default ,
                        inputs: {},
                        next: null,
                        opcode: "math_number",
                        parent: null,
                        shadow: true,
                        topLevel: false,
                        x: undefined,
                        y: undefined
                    };
                    sb[menusCacheName] ={
                        fields: {
                            OPERATOR: {
                                id: undefined,
                                name: "OPERATOR",
                                value: 'ClipCCExtension.nhjr.custom_menu.menus'
                            }
                        },
                        id: menusCacheName ,
                        inputs: {
                            NUM: {
                                block: menusCacheValueName_default,
                                name: "NUM",
                                shadow: menusCacheValueName_default
                            }
                        },
                        next: null,
                        opcode: "operator_mathop",
                        parent: null,
                        shadow: true,
                        topLevel: true,
                        x: "0",
                        y: "0"
                    };
                    menusCacheValueName= menusCacheValueName_default
                }
                /*开始缓存*/
                var name= this.allowName(a.NAME);
                const before_setMenu_hasName= menus.hasOwnProperty(name);
                if(String(a.MENU).replaceAll(' ','') =='[]') var setmenu_cache= [['','']]
                else var setmenu_cache= JSON.parse(a.MENU);
                /*循环遍历检测*/
                const er= ()=> this.logError('set menu error: not allowed type!');
                if(!(setmenu_cache instanceof Array)) return er();
                for(const i in setmenu_cache){
                    var item= setmenu_cache[i];

                    if(typeof item ==='object'){
                        /*检测不合格的内容并踢出，或修改为合格内容*/
                        if(item.length ===1) item[1]= '';

                        if(item instanceof Array && item.length  ===2){
                            if( !['string','number'].includes(typeof item[0]) ||
                                !['string','number'].includes(typeof item[1])
                            ) return er();

                            if(typeof item[0] !=='string') item[0]+='';
                        }else return er();

                    }else if(['string','number'].includes(typeof item)){
                        /*"str" 转 ["str","str"]*/
                        setmenu_cache[i]= [String(item), item]

                    }else return er()
                }
                menus[name] = setmenu_cache;
                const NUM= sb[menusCacheValueName].fields.NUM;
                var cache_str_menus = str_menus();
                if(NUM.value !== cache_str_menus) NUM.value= cache_str_menus;
                /*添加菜单使用积木*/
                if(!before_setMenu_hasName){
                    add_returnMenu_block(name)
                }
            }catch(e){return this.logError(e)}
        }
    });
    api.addBlock({
        opcode: 'nhjr.custom_menu.delete_menu',
        type: type.BlockType.COMMAND,
        messageId: 'nhjr.custom_menu.delete_menu',
        categoryId: 'nhjr.custom_menu.category',
        param: {
            NAME: {
                type: type.ParameterType.STRING,
                default: this.menus_namesMenu()[0][1],
                menu: ()=> this.menus_namesMenu()
            }
        },
        function: a=>{
            try{
                var name= this.allowName(a.NAME);
                const sb= stage_blocks();
                if(menus.hasOwnProperty(name)){
                    api.removeBlock('nhjr.custom_menu.returnMenu.'+name);
                    delete menus[name]
                }
                if(sb.hasOwnProperty(menusCacheName)){
                    const NUM= sb[menusCacheValueName].fields.NUM;
                    var cache_str_menus = str_menus();
                    if(NUM.value !== cache_str_menus){
                        /*如果结果是空的，删除缓存积木，否则同步。*/
                        if(cache_str_menus ==='{}'){
                            delete sb[menusCacheName];
                            delete sb[menusCacheValueName];
                        }else NUM.value= cache_str_menus
                    }
                }
            }catch(e){return this.logError(e)}
        }
    });
    api.addBlock({
        opcode: 'nhjr.custom_menu.deleteAll_menus',
        type: -1,
        messageId: 'nhjr.custom_menu.deleteAll_menus',
        categoryId: 'nhjr.custom_menu.category',
        function: ()=> {
            const title= 'custom_menu';
            const message= 'Are you sure to delete all menus?';
            const fun= ()=>{
                if (window.clipAlert) {
                    if (alerting) return;
                    return new Promise(resolve => {
                        alerting = true;
                        clipAlert(title, message)
                            .then(result => {
                                alerting = false;
                                resolve(result);
                            });
                    });
                }
                return confirm(message);
            };
            /* 以上代码借鉴自
            https://github.com/JasonXu134590/clipcc-extension-alert/blob/main/index.js#L40
            */
            if(fun()){
                menus= {};
                const sb= stage_blocks();
                delete sb[menusCacheName];
                delete sb[menusCacheValueName];
                resetMenus();
                loadReporter();
            }
        }
    });
    api.addBlock({
        opcode: 'nhjr.custom_menu.error',
        type: type.BlockType.REPORTER,
        messageId: 'nhjr.custom_menu.error',
        categoryId: 'nhjr.custom_menu.category',
        function: ()=> extension_error
    });
    api.addBlock({
        opcode: 'nhjr.custom_menu.menus_json',
        type: type.BlockType.REPORTER,
        messageId: 'nhjr.custom_menu.menus_json',
        categoryId: 'nhjr.custom_menu.category',
        function: ()=> str_menus()
    });
}

}