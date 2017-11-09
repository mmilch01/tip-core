package org.nrg.xnat.generated.plugin;

import org.nrg.framework.annotations.XnatDataModel;
import org.nrg.framework.annotations.XnatPlugin;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

@XnatPlugin(value = "tip_core", name = "TIP Core Plugin", description = "Maintains TIP core branding and skinning, data types, etc..")
@ComponentScan({"org.nrg.tip.daos"})
public class TipCorePlugin {
}