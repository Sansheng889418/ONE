import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { LogIn, UserPlus, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@client/src/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@client/src/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@client/src/components/ui/alert';
import { useAuth } from '@client/src/hooks/useAuth';

type TabValue = 'login' | 'register';

interface FormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabValue>('login');

  // 登录表单
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState<FormErrors>({});
  const [loginErrorMsg, setLoginErrorMsg] = useState('');

  // 注册表单
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regErrors, setRegErrors] = useState<FormErrors>({});
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerErrorMsg, setRegisterErrorMsg] = useState('');

  // 切换 tab 时清除错误
  useEffect(() => {
    setLoginErrors({});
    setRegErrors({});
    setLoginErrorMsg('');
    setRegisterErrorMsg('');
    setRegisterSuccess(false);
  }, [activeTab]);

  const validateLogin = (): boolean => {
    const errors: FormErrors = {};
    if (!loginUsername.trim()) errors.username = '请输入用户名';
    if (!loginPassword) errors.password = '请输入密码';
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = (): boolean => {
    const errors: FormErrors = {};
    if (!regUsername.trim()) {
      errors.username = '请输入用户名';
    } else if (regUsername.trim().length < 3) {
      errors.username = '用户名至少 3 个字符';
    }
    if (!regPassword) {
      errors.password = '请输入密码';
    } else if (regPassword.length < 6) {
      errors.password = '密码至少 6 位';
    }
    if (!regConfirmPassword) {
      errors.confirmPassword = '请确认密码';
    } else if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = '两次密码输入不一致';
    }
    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginErrorMsg('');
    if (!validateLogin()) return;

    try {
      const res = await login(loginUsername.trim(), loginPassword);
      if (res.success) {
        navigate('/');
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: { message?: string }, message?: string } } })?.response?.data;
      const message = data?.error?.message || data?.message || '登录失败，请重试';
      setLoginErrorMsg(message);
      logger.error('登录失败', message);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setRegisterErrorMsg('');
    setRegisterSuccess(false);
    if (!validateRegister()) return;

    try {
      const res = await register(regUsername.trim(), regPassword);
      if (res.success) {
        setRegisterSuccess(true);
        setRegUsername('');
        setRegPassword('');
        setRegConfirmPassword('');
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: { message?: string }, message?: string } } })?.response?.data;
      const message = data?.error?.message || data?.message || '注册失败，请重试';
      setRegisterErrorMsg(message);
      logger.error('注册失败', message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-foreground">
            团队待办
          </CardTitle>
          <CardDescription>
            登录或注册以管理您的任务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="size-4" />
                登录
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="size-4" />
                注册
              </TabsTrigger>
            </TabsList>

            {/* 登录面板 */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {loginErrorMsg && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>登录失败</AlertTitle>
                    <AlertDescription>{loginErrorMsg}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-username">用户名</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="请输入用户名"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    aria-invalid={!!loginErrors.username}
                    autoComplete="username"
                  />
                  {loginErrors.username && (
                    <p className="text-xs text-destructive">{loginErrors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">密码</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      aria-invalid={!!loginErrors.password}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showLoginPassword ? '隐藏密码' : '显示密码'}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-xs text-destructive">{loginErrors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? '登录中...' : '登 录'}
                </Button>
              </form>
            </TabsContent>

            {/* 注册面板 */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                {registerSuccess && (
                  <Alert variant="success">
                    <CheckCircle className="size-4" />
                    <AlertTitle>注册成功</AlertTitle>
                    <AlertDescription>
                      您的账号已提交，管理员审批后即可使用
                    </AlertDescription>
                  </Alert>
                )}

                {registerErrorMsg && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertTitle>注册失败</AlertTitle>
                    <AlertDescription>{registerErrorMsg}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reg-username">用户名</Label>
                  <Input
                    id="reg-username"
                    type="text"
                    placeholder="请输入用户名（至少 3 个字符）"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    aria-invalid={!!regErrors.username}
                    autoComplete="username"
                  />
                  {regErrors.username && (
                    <p className="text-xs text-destructive">{regErrors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">密码</Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="请输入密码（至少 6 位）"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      aria-invalid={!!regErrors.password}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showRegPassword ? '隐藏密码' : '显示密码'}
                    >
                      {showRegPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {regErrors.password && (
                    <p className="text-xs text-destructive">{regErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-confirm-password">确认密码</Label>
                  <Input
                    id="reg-confirm-password"
                    type="password"
                    placeholder="请再次输入密码"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    aria-invalid={!!regErrors.confirmPassword}
                    autoComplete="new-password"
                  />
                  {regErrors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {regErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? '注册中...' : '注 册'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
