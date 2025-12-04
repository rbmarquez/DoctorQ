"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Bell,
  Shield,
  Camera,
  Save,
  X,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function PatientProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "privacy">("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    nm_completo: "Maria Silva",
    nm_email: "maria.silva@email.com",
    nr_telefone: "(11) 98765-4321",
    dt_nascimento: "1990-05-15",
    ds_genero: "Feminino",
    ds_endereco: "Rua das Flores, 123",
    ds_bairro: "Jardins",
    ds_cidade: "São Paulo",
    ds_estado: "SP",
    nr_cep: "01234-567",
    ds_foto_url: undefined as string | undefined,
  });

  // Security data
  const [securityData, setSecurityData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Notification preferences
  const [notificationSettings, setNotificationSettings] = useState({
    email_agendamentos: true,
    email_promocoes: true,
    email_lembretes: true,
    sms_agendamentos: true,
    sms_lembretes: false,
    push_agendamentos: true,
    push_promocoes: false,
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    perfil_publico: false,
    mostrar_avaliacoes: true,
    permitir_mensagens: true,
    compartilhar_dados_pesquisa: false,
  });

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securityData.new_password !== securityData.confirm_password) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (securityData.new_password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    setIsSaving(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Senha alterada com sucesso!");
      setSecurityData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      toast.error("Erro ao alterar senha");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setIsSaving(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Preferências de notificação atualizadas!");
    } catch (error) {
      toast.error("Erro ao atualizar preferências");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    setIsSaving(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Configurações de privacidade atualizadas!");
    } catch (error) {
      toast.error("Erro ao atualizar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 5MB");
      return;
    }

    // In a real app, upload to server
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData((prev) => ({ ...prev, ds_foto_url: reader.result as string }));
      toast.success("Foto atualizada!");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-gray-600 mt-1">Gerencie suas informações pessoais e configurações</p>
            </div>
            <Link href="/paciente/dashboard">
              <Button variant="outline">Voltar ao Painel</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "profile"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Perfil</span>
                </button>

                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "security"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Lock className="h-5 w-5" />
                  <span className="font-medium">Segurança</span>
                </button>

                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "notifications"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Bell className="h-5 w-5" />
                  <span className="font-medium">Notificações</span>
                </button>

                <button
                  onClick={() => setActiveTab("privacy")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "privacy"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Privacidade</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Informações Pessoais</h2>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      Editar Perfil
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Button onClick={() => setIsEditing(false)} variant="outline">
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleProfileUpdate}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Photo Upload */}
                <div className="mb-8 flex items-center space-x-6">
                  <div className="relative">
                    {profileData.ds_foto_url ? (
                      <img
                        src={profileData.ds_foto_url}
                        alt="Foto de perfil"
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                        {profileData.nm_completo.charAt(0)}
                      </div>
                    )}
                    {isEditing && (
                      <label
                        htmlFor="photo-upload"
                        className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 border-2 border-blue-500"
                      >
                        <Camera className="h-5 w-5 text-blue-600" />
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{profileData.nm_completo}</h3>
                    <p className="text-gray-600">{profileData.nm_email}</p>
                    {isEditing && (
                      <p className="text-sm text-gray-500 mt-2">
                        Clique no ícone da câmera para alterar sua foto (máx. 5MB)
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 inline mr-2" />
                      Nome Completo
                    </label>
                    <Input
                      type="text"
                      value={profileData.nm_completo}
                      onChange={(e) => setProfileData({ ...profileData, nm_completo: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-2" />
                      E-mail
                    </label>
                    <Input
                      type="email"
                      value={profileData.nm_email}
                      onChange={(e) => setProfileData({ ...profileData, nm_email: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-2" />
                      Telefone
                    </label>
                    <Input
                      type="tel"
                      value={profileData.nr_telefone}
                      onChange={(e) => setProfileData({ ...profileData, nr_telefone: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Data de Nascimento
                    </label>
                    <Input
                      type="date"
                      value={profileData.dt_nascimento}
                      onChange={(e) => setProfileData({ ...profileData, dt_nascimento: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gênero</label>
                    <select
                      value={profileData.ds_genero}
                      onChange={(e) => setProfileData({ ...profileData, ds_genero: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                        !isEditing ? "bg-gray-50" : ""
                      }`}
                    >
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                      <option value="Prefiro não informar">Prefiro não informar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                    <Input
                      type="text"
                      value={profileData.nr_cep}
                      onChange={(e) => setProfileData({ ...profileData, nr_cep: e.target.value })}
                      disabled={!isEditing}
                      placeholder="00000-000"
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-2" />
                      Endereço
                    </label>
                    <Input
                      type="text"
                      value={profileData.ds_endereco}
                      onChange={(e) => setProfileData({ ...profileData, ds_endereco: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                    <Input
                      type="text"
                      value={profileData.ds_bairro}
                      onChange={(e) => setProfileData({ ...profileData, ds_bairro: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                    <Input
                      type="text"
                      value={profileData.ds_cidade}
                      onChange={(e) => setProfileData({ ...profileData, ds_cidade: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <select
                      value={profileData.ds_estado}
                      onChange={(e) => setProfileData({ ...profileData, ds_estado: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                        !isEditing ? "bg-gray-50" : ""
                      }`}
                    >
                      <option value="SP">São Paulo</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="RS">Rio Grande do Sul</option>
                      {/* Add more states as needed */}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Segurança da Conta</h2>

                <div className="max-w-lg space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha Atual
                    </label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={securityData.current_password}
                        onChange={(e) =>
                          setSecurityData({ ...securityData, current_password: e.target.value })
                        }
                        placeholder="Digite sua senha atual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={securityData.new_password}
                        onChange={(e) =>
                          setSecurityData({ ...securityData, new_password: e.target.value })
                        }
                        placeholder="Digite sua nova senha (mín. 8 caracteres)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Nova Senha
                    </label>
                    <Input
                      type="password"
                      value={securityData.confirm_password}
                      onChange={(e) =>
                        setSecurityData({ ...securityData, confirm_password: e.target.value })
                      }
                      placeholder="Digite novamente a nova senha"
                    />
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={
                      isSaving ||
                      !securityData.current_password ||
                      !securityData.new_password ||
                      !securityData.confirm_password
                    }
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {isSaving ? "Alterando..." : "Alterar Senha"}
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Notificações</h2>
                    <p className="text-gray-600 mt-1">Gerencie como você deseja ser notificado</p>
                  </div>
                  <Button
                    onClick={handleNotificationUpdate}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className="pb-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-blue-600" />
                      Notificações por E-mail
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-gray-700">Confirmações de agendamento</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.email_agendamentos}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              email_agendamentos: e.target.checked,
                            })
                          }
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-gray-700">Lembretes de agendamento</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.email_lembretes}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              email_lembretes: e.target.checked,
                            })
                          }
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-gray-700">Promoções e novidades</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.email_promocoes}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              email_promocoes: e.target.checked,
                            })
                          }
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div className="pb-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Phone className="h-5 w-5 mr-2 text-purple-600" />
                      Notificações por SMS
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-gray-700">Confirmações de agendamento</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.sms_agendamentos}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              sms_agendamentos: e.target.checked,
                            })
                          }
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-gray-700">Lembretes de agendamento</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.sms_lembretes}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              sms_lembretes: e.target.checked,
                            })
                          }
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-blue-600" />
                      Notificações Push
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-gray-700">Agendamentos e confirmações</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.push_agendamentos}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              push_agendamentos: e.target.checked,
                            })
                          }
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-gray-700">Promoções e ofertas especiais</span>
                        <input
                          type="checkbox"
                          checked={notificationSettings.push_promocoes}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              push_promocoes: e.target.checked,
                            })
                          }
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Privacidade</h2>
                    <p className="text-gray-600 mt-1">Controle quem pode ver suas informações</p>
                  </div>
                  <Button
                    onClick={handlePrivacyUpdate}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Seus dados estão protegidos</h3>
                        <p className="text-sm text-gray-600">
                          Nós levamos sua privacidade a sério. Suas informações pessoais são criptografadas e
                          nunca compartilhadas sem seu consentimento.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start justify-between cursor-pointer group">
                      <div className="flex-1 pr-4">
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          Perfil Público
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Permite que outros usuários vejam seu perfil básico
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings.perfil_publico}
                        onChange={(e) =>
                          setPrivacySettings({ ...privacySettings, perfil_publico: e.target.checked })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                    </label>

                    <label className="flex items-start justify-between cursor-pointer group">
                      <div className="flex-1 pr-4">
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          Mostrar Avaliações
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Exibe as avaliações que você escreveu em seu perfil
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings.mostrar_avaliacoes}
                        onChange={(e) =>
                          setPrivacySettings({ ...privacySettings, mostrar_avaliacoes: e.target.checked })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                    </label>

                    <label className="flex items-start justify-between cursor-pointer group">
                      <div className="flex-1 pr-4">
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          Permitir Mensagens
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Permite que profissionais enviem mensagens para você
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings.permitir_mensagens}
                        onChange={(e) =>
                          setPrivacySettings({ ...privacySettings, permitir_mensagens: e.target.checked })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                    </label>

                    <label className="flex items-start justify-between cursor-pointer group">
                      <div className="flex-1 pr-4">
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          Compartilhar Dados para Pesquisa
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Dados anônimos podem ser usados para melhorar nossos serviços
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings.compartilhar_dados_pesquisa}
                        onChange={(e) =>
                          setPrivacySettings({
                            ...privacySettings,
                            compartilhar_dados_pesquisa: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                    </label>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Excluir Conta</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Se você excluir sua conta, todos os seus dados serão permanentemente removidos. Esta ação
                      não pode ser desfeita.
                    </p>
                    <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                      Excluir Minha Conta
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
