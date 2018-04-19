console.log('tipWorkflowDisplay.js');

var TIP = getObject(TIP || {});

(function(){


    TIP.workflowDisplay = function(opts) {
        var searchId = opts.searchId || false,
            workflowTableId = opts.containerId || 'activeWorkflows',
            projectId = opts['projectId'] || false,
            userEditable = opts.userEditable || false,
            userAdmin = opts.admin || false,
            subjectTerm = XNAT.app.displayNames.singular.subject || 'Subject',
            sessionTerm = XNAT.app.displayNames.singular.imageSession || 'MR Session',
            projectTerm = XNAT.app.displayNames.singular.project || 'Project';

        var $container = $('#'+workflowTableId);

        var workflowTable = function(results,userEditable){
            // results: [ { patientName: '', sessionId: '', sessionLabel: '', sessionDate: '', workflowEntries: [ 'entry' ], subjectId: '', projectId: '' ]

            var wkTable = new XNAT.table({
                id: 'active-workflow-table',
                addClass: 'xnat-table',
                style: { width: '100%' }
            });

            wkTable.tr()
                .th({ addClass: 'workflowListingDetail' }, subjectTerm + ' Name')
                .th({ addClass: 'workflowListingDetail' }, 'Active ' + sessionTerm)
                .th(sessionTerm + ' Date')
                .th({ addClass: 'projectCol' }, projectTerm)
                .th('Processing Log')
                .th({ addClass: 'tipActions hidden' }, 'TIP Status');

            if (results.length) {
                results.forEach(function(result){
                    wkTable.tr()
                        .td( result.patientName )
                        .td([ showSessionLink(result) ])
                        .td( result.sessionDate )
                        .td({ addClass: 'projectCol' }, [ showProjectLink(result.projectId) ])
                        .td({ addClass: 'workflowEntry' }, [ showProcessLog(result.workflowEntries) ])
                        .td({ addClass: 'tipActions hidden center' },[ showTipActions(userEditable, result) ])
                })
            }
            else {
                wkTable.tr()
                    .td({ colspan: 7 }, 'No active workflows found');
            }

            function showSessionLink(result){
                var id = result.sessionId,
                    label = result.sessionLabel;
                return spawn('a',{
                    href: XNAT.url.rootUrl('/data/experiments/'+id+'?format=html'),
                    style: { 'font-weight': 'bold' },
                    html: label
                })
            }
            function showProjectLink(projectId){
                return spawn('a',{
                    href: XNAT.url.rootUrl('/data/projects/'+projectId+'?format=html'),
                    html: projectId
                })
            }
            function showProcessLog(entries){
                if (entries.length) {
                    var log = [];
                    entries.forEach(function(entry){
                        log.push(spawn('p',entry))
                    });
                    return spawn('!',log)
                }
            }
            function showTipActions(userEditable, result){
                if (userEditable){
                    return spawn('button', {
                        id: 'set-'+result.sessionId,
                        className: 'btn btn-sm',
                        onclick: function(){ TIP.setStatus(this, 'setActivePatientForm') },
                        data: {
                            currentStatus: 'active',
                            projectId: result.projectId,
                            subjectId: result.subjectId,
                            sessionId: result.sessionId
                        }
                    },[
                        spawn('i',{ className: 'fa fa-check' }),
                        ' Mark Complete'
                    ])
                }
            }

            return wkTable.table;

        };

        var displayProjectWorkflow = function(results){
            // get all benice and freesurfer results from a single stored search.
            // results: [ { patientName: '', sessionId: '', sessionLabel: '', sessionDate: '', workflowEntries: [ 'entry' ], subjectId: '', projectId: '' ]
            var formattedResults = [];

            results.forEach(function(result){
                if (result.project === projectId) {

                    var workflowEntries = [];

                    // add Benice QC
                    if (result['tip_beniceqc_expt_id'].length > 0) {
                        workflowEntries.push('RSN NETWORKS GENERATED: <a href="'+serverRoot+'/data/experiments/'+result['session_id']+'/assessors/'+result['tip_beniceqc_expt_id']+'">'+result['tip_beniceqc_date']+'</a>');

                        if (result['tip_beniceqc_rsn_qc_status'].length > 0) {
                            workflowEntries.push('QC: '+result['tip_beniceqc_rsn_qc_status'])
                        }
                        else {
                            workflowEntries.push('NEEDS QC')
                        }
                    }

                    // add Freesurfer
                    if (result['fs_fsdata_expt_id'].length > 0) {
                        workflowEntries.push('FREESURFER GENERATED: <a href="'+serverRoot+'/data/experiments/'+result['session_id']+'/assessors/'+result['fs_fsdata_expt_id']+'">'+result['fs_fsdata_date']+'</a>');

                        if (result['fs_fsdata_fs_qc_status'].length > 0) {
                            workflowEntries.push('QC: '+result['fs_fsdata_fs_qc_status'])
                        }
                        else {
                            workflowEntries.push('NEEDS QC')
                        }
                    }

                    formattedResults.push({
                        patientName: result['xnat_subjectdata_subject_label'],
                        sessionId: result['session_id'],
                        sessionLabel: result['label'],
                        sessionDate: result['date'],
                        subjectId: result['xnat_subjectdata_subjectid'],
                        projectId: result['project'],
                        workflowEntries: workflowEntries
                    })
                }
            });

            // add workflow table
            $container.append(workflowTable(formattedResults,userEditable));

            if (userEditable){
                // append form that gets triggered on button clicks
                $container.append(spawn('form',{ id: 'setActivePatientForm' },[
                    spawn('input',{ type: 'hidden', name: 'xnat:experimentData/fields/field[name=activeintip]/field', value: 'false' })
                ]));

                $(document).find('.tipActions').removeClass('hidden');
                $(document).find('.projectCol').addClass('hidden');
            }

        };

        var displayAllWorkflow = function(results){
            // get all benice and freesurfer results from a single stored search.
            // results: [ { patientName: '', sessionId: '', sessionLabel: '', sessionDate: '', workflowEntries: [ 'entry' ], subjectId: '', projectId: '' ]
            var formattedResults = [];

            results.forEach(function(result){

                var workflowEntries = [];

                // add Benice QC
                if (result['tip_beniceqc_expt_id'].length > 0) {
                    workflowEntries.push('RSN NETWORKS GENERATED: <a href="'+serverRoot+'/data/experiments/'+result['session_id']+'/assessors/'+result['tip_beniceqc_expt_id']+'">'+result['tip_beniceqc_date']+'</a>');

                    if (result['tip_beniceqc_rsn_qc_status'].length > 0) {
                        workflowEntries.push('QC: '+result['tip_beniceqc_rsn_qc_status'])
                    }
                    else {
                        workflowEntries.push('NEEDS QC')
                    }
                }

                // add Freesurfer
                if (result['fs_fsdata_expt_id'].length > 0) {
                    workflowEntries.push('FREESURFER GENERATED: <a href="'+serverRoot+'/data/experiments/'+result['session_id']+'/assessors/'+result['fs_fsdata_expt_id']+'">'+result['fs_fsdata_date']+'</a>');

                    if (result['fs_fsdata_fs_qc_status'].length > 0) {
                        workflowEntries.push('QC: '+result['fs_fsdata_fs_qc_status'])
                    }
                    else {
                        workflowEntries.push('NEEDS QC')
                    }
                }

                formattedResults.push({
                    patientName: result['xnat_subjectdata_subject_label'],
                    sessionId: result['session_id'],
                    sessionLabel: result['label'],
                    sessionDate: result['date'],
                    subjectId: result['xnat_subjectdata_subjectid'],
                    projectId: result['project'],
                    workflowEntries: workflowEntries
                })

            });

            $container.append(workflowTable(formattedResults));

        };

        var queryWorkflow = function(){
            var tag = (projectId) ? 'h3' : 'h2';
            $container.append( spawn(tag,subjectTerm+'s with Active Workflows') );

            XNAT.xhr.getJSON({
                url: XNAT.url.rootUrl('/data/search/saved/' + searchId + '/results?format=json'),
                success: function (data) {

                    var rawResults = data.ResultSet.Result;
                    if ((rawResults.length > 0) && (projectId)) {
                        displayProjectWorkflow(rawResults);
                    } else if (rawResults.length > 0) {
                        displayAllWorkflow(rawResults);
                    } else {
                        $container.append( spawn('p','No active '+subjectTerm+'s found') );
                    }
                },
                fail: function (e) {
                    var msg = 'An error occurred while looking up active workflows. ' + (userAdmin) ? '' : 'Please contact a site administrator.';
                    $container.append(spawn('p',msg));
                    console.log("Error found in search ID: "+ searchId);
                    console.log(e);
                }
            });
        };

        if (searchId) {
            queryWorkflow();
        }
        else {
            var msg = '<strong>TIP Setup:</strong> Workflow Display has not been enabled on this site.';
            if (userAdmin) {
                msg += ' To enable this feature, go to <code>Administer > Plugin Settings > TIP Site Setup</code> and enter the stored search ID related to your workflows.'
            }
            $container.append(spawn('div.note', msg ));
        }
    }
})();



