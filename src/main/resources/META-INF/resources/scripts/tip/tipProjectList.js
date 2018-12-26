/*
 * XNAT http://www.xnat.org
 * Copyright (c) 2014, Washington University School of Medicine
 * All Rights Reserved
 *
 * Released under the Simplified BSD.
 *
 * Last modified 7/1/13 9:12 AM
 */

function MinProjectsList(_div, _options){

    this.options = _options;
    this.div     = _div;

    if ( this.options == undefined ){
        this.options = { accessible: true };
    }

    this.init = function(){

        this.initLoader = prependLoader(this.div, "Loading " + XNAT.app.displayNames.plural.project.toLowerCase());
        this.initLoader.render();

        //load from search xml from server
        this.initCallback = {
            success: this.completeInit,
            failure: this.initFailure,
            cache: false, // Turn off caching for IE
            scope: this
        };

        var params="";

        if (this.options.recent != undefined) {
            params += "&recent=true";
        }

        if (this.options.owner != undefined) {
            params += "&owner=true";
        }

        if (this.options.member != undefined) {
            params += "&member=true";
        }

        if (this.options.collaborator != undefined) {
            params += "&collaborator=true";
        }

        if (this.options.accessible != undefined) {
            params += "&accessible="+this.options.accessible;
        }

        YAHOO.util.Connect.asyncRequest('GET',XNAT.url.rootUrl('/REST/projects?format=json&stamp='+ (new Date()).getTime() + params),this.initCallback,null,this);

    };

    this.initFailure = function (o) {
        this.initLoader.close();
    };

    this.completeInit = function (o) {
        try {
            this.projectResultSet = eval("(" + o.responseText + ")");
        }
        catch (e) {
        }

        this.initLoader.close();

        try {
            this.render();
        }
        catch (e) {
        }
    };

    this.render=function(){

        var display = document.getElementById(this.div);

        var projects = this.projectResultSet.ResultSet.Result;

        window.sort_field = "last_accessed_" + this.projectResultSet.ResultSet.xdat_user_id;

        projects = projects.sort(function(a,b){
            if( a[window.sort_field] > b[window.sort_field] ) return -1;
            if( b[window.sort_field] > a[window.sort_field] ) return 1;
            return 0;
        });

        var projectsLength = projects.length;

        for ( var pC = 0; pC < projectsLength; pC++ ){

            var p = projects[pC];

            var project_name = escapeHtml(p.name);

            // if there are no spaces in the first 42 characters, then chop it off
            if (project_name.length > 42 && project_name.substring(0,41).indexOf(' ') === -1){
                project_name = project_name.substring(0,39) + "&hellip;";
            }

            // check for the existence of this project listing before proceeding with this render process. If found, continue to the next project in the list.
            if (document.getElementById(project_name+'_project_listing')) {
                projects[pC].skipMePlease = true;
                continue;
            }

            var projDisplay = document.createElement("div");
            projDisplay.title = project_name;
            projDisplay.id = project_name+'_project_listing';
            projDisplay.className = ( pC%2 === 0 ) ? 'even' : 'odd';

            // display icon for project membership
            var accessIcon = document.createElement("div"), memberIcon;
            accessIcon.className = 'project-access';
            var role = p["user_role_"+this.projectResultSet.ResultSet.xdat_user_id];
            if (role.length > 0) {
                memberIcon = spawn('span.fa.fa-key');
                accessIcon.appendChild(memberIcon);
                accessIcon.innerHTML += (' '+role);
            } else {
                if(p.project_access && p.project_access.toLowerCase()=="public") {
                    accessIcon.innerHTML += (' guest');
                } else {
                    accessIcon.innerHTML+='<a href="javascript:XNAT.projectAccess.requestAccess(\''+p.id+'\')"><button class="btn btn-xs">Request access</button></a>';
                }
            }
            projDisplay.appendChild(accessIcon);

            // display project info
            var titleBlock = document.createElement("div");
            titleBlock.className = "project-info "+ p.id+"-info";
            titleBlock.innerHTML = '<h2 class="'+p.id+'-title">' +
                '<a href="' + serverRoot +
                '/app/template/XDATScreen_report_xnat_projectData.vm' +
                '/search_element/xnat:projectData' +
                '/search_field/xnat:projectData.ID' +
                '/search_value/' + p.id + '">' + project_name + '</a>' +
                '</h2>' +
                '<p id="'+ p.id +'_subjectLine"></p>';



            projDisplay.appendChild(titleBlock);

            display.appendChild(projDisplay);
        }

        // restart loop to add subject counts and PI info.
        for ( var pC = 0; pC < projectsLength; pC++ ){
            var p = projects[pC];
            if (!p.skipMePlease) {
                var addSubjectCallback = function (subjectLine, pid) {
                    $("." + pid + "-title").after(subjectLine);
                };
                addSubjectInfo(p.id, p.pi, addSubjectCallback);
            }
        }
    };
}

function addSubjectInfo(pid,ppi,callback) {
    XNAT.xhr.getJSON({
        url: XNAT.url.rootUrl('/REST/projects/' + pid + '/subjects?format=json'),
        success: function (data) {
            var subjectCounts = data.ResultSet.Result.length;
            if (subjectCounts > 0) {
                var pid = data.ResultSet.Result[0].project;
                var subjectLine = '<strong>Patients</strong>: ' + subjectCounts;
                if (ppi != undefined && ppi != "") {
                    subjectLine += ' <strong style="padding-left: 20px;">PI: </strong>' + escapeHtml(ppi);
                }
                $('#' + pid).html(subjectLine);
                callback(subjectLine, pid);
            }
        }
    });
}

function prependLoader(div_id,msg){
    if(div_id.id==undefined){
        var div=document.getElementById(div_id);
    }else{
        var div=div_id;
    }
    var loader_div = document.createElement("div");
    loader_div.innerHTML=msg;
    div.parentNode.insertBefore(loader_div,div);
    return new XNATLoadingGIF(loader_div);
}
