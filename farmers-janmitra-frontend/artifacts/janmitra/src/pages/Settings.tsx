import { useUserPreferences } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatMessageRequestLanguage, ChatMessageRequestUserType } from "@workspace/api-client-react";
import { getTranslation } from "@/lib/translations";
import { LANG_LABELS } from "@/lib/speech";

export default function Settings() {
  const { language, userType, setLanguage, setUserType } = useUserPreferences();
  const t = (key: string) => getTranslation(language, key);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-primary">{t("settings.title")}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.langPrefTitle")}</CardTitle>
          <CardDescription>{t("settings.langPrefDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={(v) => setLanguage(v as ChatMessageRequestLanguage)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {(Object.values(ChatMessageRequestLanguage) as any[]).map((l: any) => (
                <SelectItem key={l} value={l} className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{LANG_LABELS[l] ?? l}</span>
                    {LANG_LABELS[l] !== l && (
                      <span className="text-xs text-muted-foreground capitalize">({l})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.userProfileTitle")}</CardTitle>
          <CardDescription>{t("settings.userProfileDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={userType} onValueChange={(v) => setUserType(v as ChatMessageRequestUserType)}>
            <div className="grid gap-4 pt-2">
              {(Object.values(ChatMessageRequestUserType) as any[]).map((tVal: any) => (
                <div key={tVal} className="flex items-center space-x-2">
                  <RadioGroupItem value={tVal} id={tVal} />
                  <Label htmlFor={tVal} className="text-base cursor-pointer font-medium">
                    {t(`userTypes.${tVal}`)}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
